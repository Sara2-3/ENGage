import type { ReactNode } from 'react';
import type { Detail, Row } from './api';

export type Case = Omit<Detail, 'asOf'>;

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
// Same date format as the starter pack table.
export const date = (iso: string, withYear = true) => {
  const [y, m, d] = iso.split('-');
  return `${d}-${months[Number(m) - 1]}${withYear ? `-${y.slice(2)}` : ''}`;
};

export const has = (c: Case, ...codes: string[]) => c.assessment.flags.some((f) => codes.includes(f.code));
export const actionsFor = (c: Case, owner: string) => c.assessment.actions.filter((a) => a.ownerRole === owner);
export const movement = (c: Case) => (c.case.movement === 'NEW_HIRE' ? 'New Hire' : 'Reallocation');
export const missing = <span className="warn" title="Missing">-</span>;

export const problem = (c: Case) => c.assessment.flags[0]?.message
  ?? (c.assessment.decision === 'CAN_CLOSE' ? 'Ready to close' : 'Not enough evidence yet');

export const toRow = (c: Case): Row => ({
  id: c.case.id,
  employee: c.case.employee,
  movement: c.case.movement,
  project: c.case.project,
  startDate: c.case.startDate,
  manager: c.case.manager,
  status: c.case.trackerStatus,
  lastUpdate: c.case.lastUpdate,
  issues: c.assessment.flags.map((f) => f.code),
  colour: c.assessment.colour,
  decision: c.assessment.decision,
  label: (c.assessment.flags[0] as { label?: string } | undefined)?.label
    ?? (c.assessment.decision === 'CAN_CLOSE' ? 'Ready to close' : 'Not enough evidence'),
});

export function Metrics({ items }: { items: { title: string; value: number; tone?: string }[] }) {
  return (
    <section className="metrics">
      {items.map((m) => <div className={`card ${m.tone ?? ''}`} key={m.title}>{m.title}<strong>{m.value}</strong></div>)}
    </section>
  );
}

export function Title({ title, need }: { title: string; need: string }) {
  return (
    <header className="page-head">
      <div>
        <h1 className="page-title">{title}</h1>
        <p className="muted">{need}</p>
      </div>
      <span className="date-chip">Data as of 14 Oct 2026</span>
    </header>
  );
}

const initials = (name: string) => name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();

export function Person({ name, onOpen }: { name: string; onOpen?: () => void }) {
  return (
    <span className="person">
      <span className="avatar" aria-hidden="true">{initials(name)}</span>
      {onOpen ? <button className="link" onClick={onOpen}>{name}</button> : name}
    </span>
  );
}

export function Table({ title, head, cases, cells, onOpen, empty = 'Nothing to show.' }: {
  title: string; head: string[]; cases: Case[]; cells: (c: Case) => ReactNode[]; onOpen: (id: string) => void; empty?: string;
}) {
  return (
    <section className="panel">
      <h3 className="panel-title">{title}</h3>
      <div className="table">
        <table>
          <thead><tr><th>Employee</th>{head.map((h) => <th key={h}>{h}</th>)}</tr></thead>
          <tbody>
            {cases.map((c) => (
              <tr key={c.case.id} onClick={() => onOpen(c.case.id)}>
                <td><Person name={c.case.employee} onOpen={() => onOpen(c.case.id)} /></td>
                {cells(c).map((cell, i) => <td key={i}>{cell}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
        {!cases.length && <p className="empty muted">{empty}</p>}
      </div>
    </section>
  );
}

export function List({ items }: { items: string[] }) {
  return items.length
    ? <ul className="plain">{items.map((x, i) => <li key={i}>{x}</li>)}</ul>
    : <span className="muted">-</span>;
}

// Where the onboarding currently stands, without detail.
const phases = ['Assignment', 'Start', 'Learning plan', 'Activities', 'Technical validation'];
export const allPhases = [...phases, 'Final checks', 'Completed'];
export const completed = (c: Case) => c.assessment.decision === 'CAN_CLOSE';
export const phase = (c: Case) => {
  if (completed(c)) return 'Completed';
  const next = c.stages.findIndex((s) => !s.done);
  return next < 0 ? 'Final checks' : phases[next];
};
