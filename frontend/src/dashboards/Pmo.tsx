// PMO: the highest view, read only. Who is ready, which projects have which team, what is being
// asked of HR and what the Line Manager is doing. Technical tasks are not shown.
import type { ReactNode } from 'react';
import { words, type StaffingRequest } from '../api';
import CvLink from '../CvLink';
import { latest } from '../Reports';
import { completed, date, movement, Person, phase, requestState, Title, type Case } from '../shared';

const accessCodes = ['OPEN_BLOCKER', 'BLOCKED_NO_DETAIL', 'ACCESS_NOT_USABLE', 'UNANSWERED_REQUEST'];

// Readiness needs the Technical Lead's validation; the tracker status alone is only a claim.
const readiness = (c: Case) => {
  if (completed(c)) return { text: 'Ready', tone: 'GREEN' };
  if (c.assessment.colour === 'RED') return { text: 'Not ready: at risk', tone: 'RED' };
  if (c.stages[c.stages.length - 1].done) return { text: 'Validated, items open', tone: 'AMBER' };
  return { text: 'Not ready', tone: 'GREY' };
};

const names = (values: (string | null | undefined)[]) =>
  [...new Set(values.filter(Boolean))].join(', ') || <span className="muted">Not assigned</span>;

function Table({ title, head, rows, empty }: { title: string; head: string[]; rows: ReactNode[]; empty: string }) {
  return (
    <section className="panel">
      <h3 className="panel-title">{title}</h3>
      <div className="table">
        <table className="static">
          <thead><tr>{head.map((h) => <th key={h}>{h}</th>)}</tr></thead>
          <tbody>{rows}</tbody>
        </table>
        {!rows.length && <p className="empty muted">{empty}</p>}
      </div>
    </section>
  );
}

export default function Pmo({ cases, staffing, onOpen }: { cases: Case[]; staffing: StaffingRequest[]; onOpen: (id: string) => void }) {
  const projects = [...new Set([...cases.flatMap((c) => (c.case.project ? [c.case.project] : [])), ...staffing.map((s) => s.project)])].sort();
  const requirements = cases.filter((c) => requestState(c));
  const openRequests = staffing.filter((s) => !s.specs?.assigned).length + requirements.filter((c) => requestState(c) === 'WAITING').length;
  const lineWork = cases.filter((c) => latest(c, 'LINE_MANAGER') || c.blockers.length
    || (c.feedback ?? []).some((r) => r.role === 'LINE_MANAGER') || c.assessment.flags.some((f) => accessCodes.includes(f.code)));
  const openBlockers = cases.filter((c) => c.blockers.some((b) => !b.resolved) || c.assessment.flags.some((f) => accessCodes.includes(f.code))).length;

  const kpis = [
    ['Employees', cases.length, ''],
    ['Ready', cases.filter(completed).length, 'green'],
    ['At risk', cases.filter((c) => c.assessment.colour === 'RED').length, 'red'],
    ['People blocked', openBlockers, 'red'],
    ['Open requests to HR', openRequests, 'amber'],
    ['Projects', projects.length, ''],
  ] as const;

  return (
    <div className="wide">
      <Title title="PMO overview" need="Readiness, projects, requests and blockers across the whole system." />

      <section className="metrics">
        {kpis.map(([label, value, tone]) => <div className={`card ${tone}`} key={label}>{label}<strong>{value}</strong></div>)}
      </section>

      <Table title="Employee readiness" empty="No employees."
        head={['Employee', 'Project', 'Phase', 'Progress', 'Readiness', 'Tracker says', 'Main problem', 'CV']}
        rows={cases.map((c) => {
          const done = c.stages.filter((s) => s.done).length;
          const state = readiness(c);
          return (
            <tr key={c.case.id}>
              <td><Person name={c.case.employee} onOpen={() => onOpen(c.case.id)} /><small>{movement(c)}</small></td>
              <td>{c.case.project ?? <span className="warn">None</span>}</td>
              <td>{phase(c)}</td>
              <td className="nowrap"><progress max={c.stages.length} value={done} aria-label={`${done} of ${c.stages.length} steps`} /> {done}/{c.stages.length}</td>
              <td><span className={`pill ${state.tone}`}>{state.text}</span></td>
              <td>{c.case.trackerStatus}</td>
              <td>{c.assessment.flags[0]?.message ?? <span className="muted">None</span>}</td>
              <td><CvLink c={c} role="PMO" /></td>
            </tr>
          );
        })} />

      <Table title="Projects and teams" empty="No projects."
        head={['Project', 'Employees', 'Manager', 'Additional Manager', 'Technical Lead', 'Line Manager', 'Ready', 'Requests to HR']}
        rows={projects.map((p) => {
          const team = cases.filter((c) => c.case.project === p);
          const asked = staffing.filter((s) => s.project === p);
          return (
            <tr key={p}>
              <td><strong>{p}</strong></td>
              <td>{team.map((c) => c.case.employee).join(', ') || <span className="muted">Nobody yet</span>}</td>
              <td>{names(team.map((c) => c.case.manager))}</td>
              <td>{names(team.map((c) => c.details.ktOwner))}</td>
              <td>{names(team.map((c) => c.details.techLead))}</td>
              <td>{names(team.map((c) => c.details.lineManager))}</td>
              <td>{team.filter(completed).length} of {team.length}</td>
              <td>{asked.length ? `${asked.filter((s) => !s.specs?.assigned).length} open of ${asked.length}` : <span className="muted">None</span>}</td>
            </tr>
          );
        })} />

      <Table title="Additional Manager → HR: people requested for projects" empty="No people requested yet."
        head={['Project', 'Role', 'Skills', 'Level', 'Needed from', 'Person', 'Status']}
        rows={staffing.map((s) => (
          <tr key={s.id}>
            <td><strong>{s.project}</strong></td>
            <td>{s.need}<small>{s.specs?.type === 'NEW_HIRE' ? 'New hire' : 'From the company'}</small></td>
            <td>{s.specs?.skills}</td>
            <td>{s.specs?.level ? words(s.specs.level) : '-'}</td>
            <td>{s.specs?.startDate ? date(s.specs.startDate) : '-'}</td>
            <td>{cases.find((c) => c.case.id === s.caseId)?.case.employee ?? <span className="muted">Not found yet</span>}</td>
            <td><span className={`pill ${s.specs?.assigned ? 'GREEN' : 'AMBER'}`}>{!s.caseId ? 'Waiting for HR' : s.specs?.assigned ? 'Assigned' : 'Found by HR'}</span></td>
          </tr>
        ))} />

      <Table title="Additional Manager → HR: requirements about employees" empty="No requirements yet."
        head={['Employee', 'Project', 'What is required', 'Status']}
        rows={requirements.map((c) => (
          <tr key={c.case.id}>
            <td><Person name={c.case.employee} onOpen={() => onOpen(c.case.id)} /></td>
            <td>{c.case.project ?? '-'}</td>
            <td>{c.details.requirement}</td>
            <td><span className={`pill ${requestState(c) === 'WAITING' ? 'AMBER' : 'GREEN'}`}>{requestState(c) === 'WAITING' ? 'Waiting for HR' : 'Answered by HR'}</span></td>
          </tr>
        ))} />

      <Table title="Line Manager: blockers, reports and reviews" empty="Nothing from the Line Manager yet."
        head={['Employee', 'Problem', 'Blocker, owner and follow-up', 'Report to Additional Manager', 'Review']}
        rows={lineWork.map((c) => {
          const report = latest(c, 'LINE_MANAGER');
          const review = [...(c.feedback ?? [])].reverse().find((r) => r.role === 'LINE_MANAGER');
          return (
            <tr key={c.case.id}>
              <td><Person name={c.case.employee} onOpen={() => onOpen(c.case.id)} /></td>
              <td>{c.assessment.flags.find((f) => accessCodes.includes(f.code))?.message ?? <span className="muted">None open</span>}</td>
              <td>
                {c.blockers.map((b) => (
                  <small key={b.description}>
                    <span className={`pill ${b.resolved ? 'GREEN' : 'AMBER'}`}>{b.resolved ? 'Fixed' : 'Open'}</span>{' '}
                    {b.description} · {b.owner ?? 'unassigned'} · {b.nextFollowUp ? date(b.nextFollowUp, false) : 'no date'}
                  </small>
                ))}
                {!c.blockers.length && <span className="muted">No owner yet</span>}
              </td>
              <td>{report ? `${words(report.status)}: ${report.note}` : <span className="muted">No report</span>}</td>
              <td>{review ? `${words(review.rating)}: ${review.text}` : <span className="muted">-</span>}</td>
            </tr>
          );
        })} />
    </div>
  );
}
