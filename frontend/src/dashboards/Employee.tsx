// Employee (starter pack section 2): role, contacts, access, learning activities, pending actions
// and readiness expectations. Access states follow section 7, readiness section 8.
// The page answers first "where am I and what do I do now", then shows the details.
import { useState } from 'react';
import Actions from '../Actions';
import { api } from '../api';
import { date, movement, Title, type Case } from '../shared';

const accessSteps = ['Requested', 'Approved', 'Usable'];
const accessDone: Record<string, number> = { REQUESTED: 1, APPROVED: 2, USABLE: 3 };
const learningSteps = ['Shadowing', 'Supported', 'Independent'];
const learningDone: Record<string, number> = { SHADOWING: 1, SUPPORTED: 2, INDEPENDENT: 3 };

const forMe = (title: string) => title.replace('Confirm the employee can use', 'Confirm that you can use');

function Steps({ steps, done }: { steps: string[]; done: number }) {
  return (
    <ol className="steps">
      {steps.map((s, i) => (
        <li key={s} className={i < done ? 'done' : ''}>
          {i < done ? '✓ ' : ''}{s}<span className="sr-only">{i < done ? ' (done)' : ' (not yet)'}</span>
        </li>
      ))}
    </ol>
  );
}

function Fact({ label, value, from }: { label: string; value?: string | null; from: string }) {
  return (
    <div className="fact">
      <dt>{label}</dt>
      <dd>{value || <><span className="warn">Missing</span> <span className="muted">{from} adds it</span></>}</dd>
    </div>
  );
}

export default function Employee({ cases, who, onPick, onSaved }: {
  cases: Case[]; who: string; onPick: (id: string) => void; onSaved: () => void;
}) {
  const [note, setNote] = useState('');
  const c = cases.find((x) => x.case.id === who) ?? cases[0];
  if (!c) return null;
  const d = c.details;

  const mine = c.assessment.actions.filter((a) => a.ownerRole === 'Employee');
  const waiting = c.assessment.actions.filter((a) => a.ownerRole !== 'Employee');
  const blockers = c.blockers.filter((b) => !b.resolved);
  const next = mine[0];
  // The system named in my next action, so it can be confirmed right from the top of the page.
  const nextSystem = next && c.access.find((a) => a.state !== 'USABLE' && next.title.endsWith(a.system));
  const usable = c.access.filter((a) => a.state === 'USABLE').length;
  const folder = d.docsLocation ?? c.evidence.map((e) => e.text.match(/\/Team\/[\w/]+/)?.[0]).find(Boolean);
  const validated = c.stages[c.stages.length - 1].done;

  const confirmUsable = async (system: string) => {
    try {
      await api(`/cases/${c.case.id}/events`, { type: 'ACCESS', actorRole: 'EMPLOYEE', payload: { system, state: 'USABLE' } });
      setNote(`Thank you. ${system} is recorded as usable.`);
      onSaved();
    } catch (error) { setNote((error as Error).message); }
  };

  return (
    <>
      <Title title={`Hello, ${c.case.employee.split(' ')[0]}`}
        need={`${movement(c)} · project ${c.case.project ?? 'not assigned yet'} · started ${date(c.case.startDate)}`} />
      <label className="role">Signed in as (demo, no login)
        <select value={c.case.id} onChange={(e) => { setNote(''); onPick(e.target.value); }}>
          {cases.map((x) => <option key={x.case.id} value={x.case.id}>{x.case.employee}</option>)}
        </select>
      </label>

      <section className="card now">
        <div>
          <p className="eyebrow">What you do now</p>
          <h2>{next ? forMe(next.title) : 'Nothing for you to do right now'}</h2>
          <p className="muted">
            {waiting.length ? `Open steps waiting on others: ${waiting.length}.` : 'Nothing is waiting on others.'}
          </p>
        </div>
        {nextSystem && <button className="primary" onClick={() => confirmUsable(nextSystem.system)}>I can use {nextSystem.system}</button>}
        {note && <p role="status">{note}</p>}
      </section>

      <section className="card">
        <h3>Where you are</h3>
        <ol className="stages">
          {c.stages.map((s) => <li key={s.title} className={s.done ? 'done' : ''}>{s.done ? '✓' : '○'} {s.title}</li>)}
        </ol>
      </section>

      <div className="columns">
        <div>
          <section className="card">
            <h3>My access{c.access.length > 0 && `: ${usable} of ${c.access.length} usable`}</h3>
            {c.access.map((a) => (
              <div className="item" key={a.system}>
                <div className="item-head">
                  <strong>{a.system}</strong>
                  {a.state !== 'USABLE' && <button onClick={() => confirmUsable(a.system)}>I can use it</button>}
                </div>
                <Steps steps={accessSteps} done={accessDone[a.state] ?? 0} />
                <small>
                  {a.note} · Requested {a.requestedOn ? date(a.requestedOn, false) : '-'} · Owner: {a.owner ?? 'unassigned'}
                  {' '}· Next follow-up: {a.nextFollowUp ? date(a.nextFollowUp, false) : 'not set'}
                </small>
              </div>
            ))}
            {!c.access.length && <p className="muted">No access information recorded yet.</p>}
            <p className="muted">An account counts only when you can use it. Never write passwords here.</p>
          </section>

          <section className="card">
            <h3>My learning</h3>
            {c.activities.map((a) => (
              <div className="item" key={a.name}>
                <div className="item-head">
                  <strong>{a.name}</strong>
                  <span className={`pill ${a.validatedByTechOwner ? 'GREEN' : 'GREY'}`}>{a.validatedByTechOwner ? 'Validated' : 'Not validated'}</span>
                </div>
                <Steps steps={learningSteps} done={learningDone[a.level] ?? 0} />
              </div>
            ))}
            {!c.activities.length && <p className="muted">Your learning plan is not set yet. The Technical Lead sets it.</p>}
            <details>
              <summary>What do these levels mean?</summary>
              <ul>
                <li><strong>Shadowing:</strong> you observe and ask questions.</li>
                <li><strong>Supported:</strong> you do the work with guidance.</li>
                <li><strong>Independent:</strong> you work without step-by-step help and know when to escalate.</li>
                <li><strong>Ready with Support:</strong> operational, with occasional help on complex cases.</li>
                <li><strong>Partially Ready:</strong> independent for part of the scope only.</li>
              </ul>
            </details>
          </section>
        </div>

        <div>
          <section className="card">
            <h3>Waiting on others</h3>
            {waiting.map((a) => (
              <div className="item" key={a.title}>{a.title}<small>{a.ownerRole}</small></div>
            ))}
            {blockers.map((b, i) => (
              <div className="item" key={i}>{b.description}<small>Blocker · {b.owner ?? 'unassigned'}</small></div>
            ))}
            {!waiting.length && !blockers.length && <p className="muted">Nothing is waiting.</p>}
          </section>

          <section className="card">
            <h3>My role and contacts</h3>
            <dl>
              <Fact label="Exact role" value={d.role} from="HR" />
              <Fact label="Manager" value={c.case.manager} from="HR" />
              <Fact label="Line Manager" value={d.lineManager} from="HR" />
              <Fact label="Technical Lead" value={d.techLead} from="HR" />
              <Fact label="Additional Manager" value={d.ktOwner} from="HR" />
            </dl>
          </section>

          <section className="card">
            <h3>My readiness</h3>
            <p>
              <span className={`pill ${validated ? 'GREEN' : 'AMBER'}`}>
                {validated ? 'Validated by the Technical Lead' : 'Not validated yet'}
              </span>
            </p>
            <dl>
              <Fact label="Tracker status" value={c.case.trackerStatus} from="HR" />
              <Fact label="Review date" value={d.reviewDate} from="Technical Lead" />
              <Fact label="Documents folder" value={folder} from="Technical Lead" />
            </dl>
            <p className="muted">Final readiness needs observed work and technical-owner validation.</p>
          </section>

          <section className="card">
            <h3>Send an update</h3>
            <p className="muted">Check-in, progress or blocker.</p>
            <Actions key={c.case.id} role="EMPLOYEE" data={{ ...c, asOf: '' }} onSaved={onSaved} />
          </section>
        </div>
      </div>
    </>
  );
}
