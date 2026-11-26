// Data access. Uses PostgreSQL when DATABASE_URL is set; otherwise keeps
// data in memory from the JSON seed files. A configured but unreachable database is an error.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Pool, types } from 'pg';
import type { Evidence, Facts, OnboardingCase } from '../rules/types';
import type { CaseEvent, NewEvent } from '../rules/workflow';

export interface Review {
  caseId: string;
  decision: 'approved' | 'rejected';
  message: string;
  at: string;
}

export interface StaffingSpecs {
  type: 'NEW_HIRE' | 'REALLOCATION';
  direction?: string;
  skills: string;
  level: string;
  startDate: string;
  notes: string;
}

export interface StaffingRequest {
  id: number;
  project: string;
  need: string;
  specs: StaffingSpecs;
  status: 'OPEN' | 'FILLED';
  caseId: string | null;
  date: string;
}

export interface Data {
  cases: OnboardingCase[];
  evidence: Evidence[];
  facts: Record<string, Facts>;
  events: CaseEvent[];
}

const load = <T>(name: string): T =>
  JSON.parse(readFileSync(join(__dirname, '../../../data', name), 'utf8')) as T;

const seed = {
  cases: load<OnboardingCase[]>('cases.json'),
  evidence: load<Evidence[]>('evidence.json'),
  facts: load<Record<string, Facts>>('facts.json'),
};

const memory = {
  cases: [...seed.cases], events: [] as CaseEvent[], reviews: [] as Review[], staffing: [] as StaffingRequest[],
};
let pool: Pool | null = null;

export const storage = () => (pool ? 'postgresql' : 'memory');

const SCHEMA = `
  CREATE TABLE IF NOT EXISTS cases (
    id text PRIMARY KEY,
    employee text NOT NULL,
    start_date date NOT NULL,
    movement text NOT NULL CHECK (movement IN ('NEW_HIRE','REALLOCATION')),
    project text,
    manager text,
    tracker_status text NOT NULL,
    last_update date NOT NULL
  );
  ALTER TABLE cases ADD COLUMN IF NOT EXISTS direction text;
  CREATE TABLE IF NOT EXISTS evidence (
    id text PRIMARY KEY,
    case_id text NOT NULL REFERENCES cases(id),
    evidence_date date NOT NULL,
    author_role text NOT NULL,
    title text NOT NULL,
    body text NOT NULL
  );
  CREATE TABLE IF NOT EXISTS case_facts (
    case_id text PRIMARY KEY REFERENCES cases(id),
    facts jsonb NOT NULL
  );
  CREATE TABLE IF NOT EXISTS events (
    id serial PRIMARY KEY,
    case_id text NOT NULL REFERENCES cases(id),
    type text NOT NULL,
    actor_role text NOT NULL,
    payload jsonb NOT NULL,
    event_date date NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
  );
  CREATE TABLE IF NOT EXISTS staffing_requests (
    id serial PRIMARY KEY,
    project text NOT NULL,
    need text NOT NULL,
    status text NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN','FILLED')),
    case_id text REFERENCES cases(id),
    request_date date NOT NULL
  );
  ALTER TABLE staffing_requests ADD COLUMN IF NOT EXISTS specs jsonb NOT NULL DEFAULT '{}';
  CREATE TABLE IF NOT EXISTS reviews (
    id serial PRIMARY KEY,
    case_id text NOT NULL REFERENCES cases(id),
    decision text NOT NULL CHECK (decision IN ('approved','rejected')),
    message text NOT NULL,
    created_at text NOT NULL
  );
`;

const insertCase = (c: OnboardingCase) => pool!.query(
  'INSERT INTO cases (id, employee, start_date, movement, project, manager, tracker_status, last_update, direction) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) ON CONFLICT (id) DO NOTHING',
  [c.id, c.employee, c.startDate, c.movement, c.project, c.manager, c.trackerStatus, c.lastUpdate, c.direction ?? null]);

export async function initStorage(env = process.env) {
  if (!env.DATABASE_URL) return;
  types.setTypeParser(1082, (v: string) => v); // keep dates as YYYY-MM-DD strings
  pool = new Pool({ connectionString: env.DATABASE_URL });
  await pool.query(SCHEMA);

  // Seed only what is missing, so changes made in the database are kept.
  for (const c of seed.cases) {
    await insertCase(c);
    // Rows seeded before the column existed get their direction now.
    if (c.direction) await pool.query('UPDATE cases SET direction = $2 WHERE id = $1 AND direction IS NULL', [c.id, c.direction]);
  }
  for (const e of seed.evidence) {
    await pool.query('INSERT INTO evidence VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT (id) DO NOTHING',
      [e.id, e.caseId, e.date, e.authorRole, e.title, e.text]);
  }
  for (const [caseId, f] of Object.entries(seed.facts)) {
    await pool.query('INSERT INTO case_facts VALUES ($1,$2) ON CONFLICT (case_id) DO NOTHING',
      [caseId, JSON.stringify(f)]);
    // Rows seeded earlier get the description too; one written in the app is kept as a later event.
    if (f.details?.description) {
      await pool.query(
        `UPDATE case_facts SET facts = jsonb_set(facts, '{details}', coalesce(facts->'details', '{}') || jsonb_build_object('description', $2::text))
         WHERE case_id = $1 AND facts #>> '{details,description}' IS NULL`,
        [caseId, f.details.description]);
    }
  }
}

export async function closeStorage() {
  await pool?.end();
  pool = null;
}

async function rows<T>(sql: string, params: unknown[] = []): Promise<T[]> {
  return (await pool!.query(sql, params)).rows as T[];
}

export async function readData(): Promise<Data> {
  if (!pool) return { cases: memory.cases, evidence: seed.evidence, facts: seed.facts, events: memory.events };
  const cases = await rows<OnboardingCase>(
    `SELECT id, employee, start_date AS "startDate", movement, project, manager,
            tracker_status AS "trackerStatus", last_update AS "lastUpdate", direction FROM cases ORDER BY id`);
  const evidence = await rows<Evidence>(
    `SELECT id, case_id AS "caseId", evidence_date AS date, author_role AS "authorRole", title, body AS text
     FROM evidence ORDER BY id`);
  const facts = await rows<{ caseId: string; facts: Facts }>('SELECT case_id AS "caseId", facts FROM case_facts');
  const events = await rows<CaseEvent>(
    `SELECT id, case_id AS "caseId", type, actor_role AS "actorRole", payload, event_date AS date
     FROM events ORDER BY id`);
  return { cases, evidence, facts: Object.fromEntries(facts.map((f) => [f.caseId, f.facts])), events };
}

export async function addCase(c: OnboardingCase) {
  if (!pool) memory.cases.push(c);
  else await insertCase(c);
}

export async function addEvent(caseId: string, e: NewEvent, date: string) {
  if (!pool) {
    memory.events.push({ ...e, id: memory.events.length + 1, caseId, date });
    return;
  }
  await pool.query('INSERT INTO events (case_id, type, actor_role, payload, event_date) VALUES ($1,$2,$3,$4,$5)',
    [caseId, e.type, e.actorRole, JSON.stringify(e.payload), date]);
}

export async function readReviews(caseId: string): Promise<Review[]> {
  if (!pool) return memory.reviews.filter((r) => r.caseId === caseId);
  return rows<Review>(
    'SELECT case_id AS "caseId", decision, message, created_at AS at FROM reviews WHERE case_id = $1 ORDER BY id',
    [caseId]);
}

export async function addReview(r: Review) {
  if (!pool) {
    memory.reviews.push(r);
    return;
  }
  await pool.query('INSERT INTO reviews (case_id, decision, message, created_at) VALUES ($1,$2,$3,$4)',
    [r.caseId, r.decision, r.message, r.at]);
}

export async function readStaffing(): Promise<StaffingRequest[]> {
  if (!pool) return memory.staffing;
  return rows<StaffingRequest>(
    `SELECT id, project, need, specs, status, case_id AS "caseId", request_date AS date FROM staffing_requests ORDER BY id`);
}

export async function addStaffing(project: string, need: string, specs: StaffingSpecs, date: string) {
  if (!pool) {
    memory.staffing.push({ id: memory.staffing.length + 1, project, need, specs, status: 'OPEN', caseId: null, date });
    return;
  }
  await pool.query('INSERT INTO staffing_requests (project, need, specs, request_date) VALUES ($1,$2,$3,$4)', [project, need, specs, date]);
}

export async function fillStaffing(id: number, caseId: string) {
  if (!pool) {
    Object.assign(memory.staffing.find((x) => x.id === id)!, { status: 'FILLED', caseId });
    return;
  }
  await pool.query(`UPDATE staffing_requests SET status = 'FILLED', case_id = $2 WHERE id = $1`, [id, caseId]);
}
