// What the Overview pages of PMO and Management show under the numbers: a short version of each
// subject, with "See all" leading to its page.
import type { ReactNode } from 'react';
import { words, type StaffingRequest } from './api';
import { latest } from './Reports';
import { completed, date, Person, phase, type Case } from './shared';

type Open = (id: string) => void;

function Panel({ title, more, onMore, children }: { title: string; more?: string; onMore?: () => void; children: ReactNode }) {
  return (
    <section className="card">
      <div className="item-head">
        <h3>{title}</h3>
        {onMore && <button type="button" className="link" onClick={onMore}>{more ?? 'See all'}</button>}
      </div>
      {children}
    </section>
  );
}

export function Phases({ cases }: { cases: Case[] }) {
  const counts = new Map<string, number>();
  cases.forEach((c) => counts.set(phase(c), (counts.get(phase(c)) ?? 0) + 1));
  return (
    <Panel title="Where people are in onboarding">
      {[...counts].sort((a, b) => b[1] - a[1]).map(([name, n]) => (
        <div className="item" key={name}>
          <span className="grow">{name}</span>
          <span className="item-end"><progress max={cases.length} value={n} aria-label={`${n} of ${cases.length} people`} /><strong>{n}</strong></span>
        </div>
      ))}
      {!cases.length && <p className="muted">No employees yet.</p>}
    </Panel>
  );
}

export function Projects({ cases, onMore }: { cases: Case[]; onMore: () => void }) {
  const projects = [...new Set(cases.flatMap((c) => (c.case.project ? [c.case.project] : [])))].sort();
  return (
    <Panel title="Readiness by project" onMore={onMore}>
      {projects.map((p) => {
        const team = cases.filter((c) => c.case.project === p);
        const ready = team.filter(completed).length;
        const risk = team.filter((c) => c.assessment.colour === 'RED').length;
        return (
          <div className="item" key={p}>
            <strong className="grow">{p}</strong>
            <span className="item-end">
              {risk > 0 && <span className="pill RED">{risk} at risk</span>}
              <progress max={team.length} value={ready} aria-label={`${ready} of ${team.length} ready`} />
              <span>{ready}/{team.length} ready</span>
            </span>
          </div>
        );
      })}
      {!projects.length && <p className="muted">No projects yet.</p>}
    </Panel>
  );
}

// Red cases first, then amber, each with its first problem and who acts next.
export function Attention({ cases, onOpen, onMore }: { cases: Case[]; onOpen: Open; onMore: () => void }) {
  const list = ['RED', 'AMBER'].flatMap((colour) => cases.filter((c) => c.assessment.colour === colour)).slice(0, 5);
  return (
    <Panel title="Main problems" onMore={onMore}>
      {list.map((c) => (
        <div className="item" key={c.case.id}>
          <div className="grow">
            <Person name={c.case.employee} onOpen={() => onOpen(c.case.id)} />
            <small>{c.assessment.flags[0]?.message ?? 'Needs a check'}</small>
            {c.assessment.actions[0] && <small>Next: {c.assessment.actions[0].title} ({c.assessment.actions[0].ownerRole})</small>}
          </div>
          <span className={`pill ${c.assessment.colour}`}>{c.assessment.colour === 'RED' ? 'At risk' : 'Check'}</span>
        </div>
      ))}
      {!list.length && <p className="muted">Nothing needs attention.</p>}
    </Panel>
  );
}

export function Requests({ cases, staffing, onMore }: { cases: Case[]; staffing: StaffingRequest[]; onMore: () => void }) {
  return (
    <Panel title="People requested from HR" onMore={onMore}>
      {staffing.slice(-5).reverse().map((s) => (
        <div className="item" key={s.id}>
          <div className="grow">
            <strong>{s.need}</strong>
            <small>{s.project} · {cases.find((c) => c.case.id === s.caseId)?.case.employee ?? 'nobody found yet'}</small>
          </div>
          <span className={`pill ${s.specs?.assigned ? 'GREEN' : 'AMBER'}`}>{!s.caseId ? 'Waiting for HR' : s.specs?.assigned ? 'Assigned' : 'Found by HR'}</span>
        </div>
      ))}
      {!staffing.length && <p className="muted">No people requested yet.</p>}
    </Panel>
  );
}

export function LatestReports({ cases, onOpen, onMore }: { cases: Case[]; onOpen: Open; onMore: () => void }) {
  const reports = cases.flatMap((c) => {
    const report = latest(c, 'ADDITIONAL_MANAGER');
    return report ? [{ c, report }] : [];
  });
  return (
    <Panel title="Reports from Additional Manager" onMore={onMore}>
      {reports.slice(0, 5).map(({ c, report }) => (
        <div className="item" key={c.case.id}>
          <div className="grow">
            <Person name={c.case.employee} onOpen={() => onOpen(c.case.id)} />
            <small>{report.note} · {date(report.date)}</small>
          </div>
          <span className={`pill ${report.status === 'NEEDS_HELP' ? 'RED' : 'GREEN'}`}>{words(report.status)}</span>
        </div>
      ))}
      {!reports.length && <p className="muted">No reports yet. They appear here when the Additional Manager sends one.</p>}
    </Panel>
  );
}
