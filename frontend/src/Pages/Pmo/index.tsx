// PMO: the highest view, read only. Who is ready, which projects have which team, what is being
// asked of HR and what the Line Manager is doing. Technical tasks are not shown.
import { useState } from 'react';
import { words, type StaffingRequest } from '../api';
import CvLink from '../CvLink';
import { Attention, Phases, Projects, Requests } from '../OverviewPanels';
import { latest } from '../Reports';
import { Table } from '../Table';
import { completed, date, movement, Person, phase, type Case } from '../shared';

const accessCodes = ['OPEN_BLOCKER', 'BLOCKED_NO_DETAIL', 'ACCESS_NOT_USABLE', 'UNANSWERED_REQUEST'];

// Readiness needs the Technical Lead's validation; the tracker status alone is only a claim.
const readiness = (c: Case) => {
  if (completed(c)) return { text: 'Ready', tone: 'GREEN' };
  if (c.assessment.colour === 'RED') return { text: 'Not ready: at risk', tone: 'RED' };
  if (c.stages[c.stages.length - 1].done) return { text: 'Validated, items open', tone: 'AMBER' };
  return { text: 'Not ready', tone: 'GREY' };
};

const isBlocked = (c: Case) => c.blockers.some((b) => !b.resolved) || c.assessment.flags.some((f) => accessCodes.includes(f.code));

// The employee cards filter the readiness table; the other two lead to their own table.
const filters: Record<string, (c: Case) => boolean> = {
  Employees: () => true,
  Ready: completed,
  'At risk': (c) => c.assessment.colour === 'RED',
  'People blocked': isBlocked,
};
const targets: Record<string, string> = { 'Open requests to HR': 'requests', Projects: 'projects' };

const names = (values: (string | null | undefined)[]) =>
  [...new Set(values.filter(Boolean))].join(', ') || <span className="muted">Not assigned</span>;

export default function Pmo({ page, onPage, cases, staffing, onOpen }: {
  page: string; onPage: (key: string) => void; cases: Case[]; staffing: StaffingRequest[]; onOpen: (id: string) => void;
}) {
  const projects = [...new Set([...cases.flatMap((c) => (c.case.project ? [c.case.project] : [])), ...staffing.map((s) => s.project)])].sort();
  const [filter, setFilter] = useState('Employees');
  const shown = cases.filter(filters[filter]);
  const openRequests = staffing.filter((s) => !s.specs?.assigned).length;
  const lineWork = cases.filter((c) => latest(c, 'LINE_MANAGER') || c.blockers.length
    || (c.feedback ?? []).some((r) => r.role === 'LINE_MANAGER') || c.assessment.flags.some((f) => accessCodes.includes(f.code)));
  const openBlockers = cases.filter(isBlocked).length;

  const pick = (label: string) => {
    if (filters[label]) setFilter(label);
    onPage(targets[label] ?? 'employees');
  };

  const kpis = [
    ['Employees', cases.length, ''],
    ['Ready', cases.filter(completed).length, 'green'],
    ['At risk', cases.filter((c) => c.assessment.colour === 'RED').length, 'red'],
    ['People blocked', openBlockers, 'red'],
    ['Open requests to HR', openRequests, 'amber'],
    ['Projects', projects.length, ''],
  ] as const;

  // The whole portfolio in one line: ready, still in progress, at risk.
  const ready = cases.filter(completed).length;
  const risk = cases.filter((c) => c.assessment.colour === 'RED');
  const share = (n: number) => (cases.length ? Math.round((n / cases.length) * 100) : 0);
  const health = [['Ready', ready, 'ok'], ['In progress', cases.length - ready - risk.length, 'run'], ['At risk', risk.length, 'bad']] as const;

  return (
    <div className="wide ceo">
      {page === 'overview' && <>
      <header className="ceo-head">
        <div className="ceo-score" style={{ background: `conic-gradient(var(--brand) ${share(ready)}%, var(--line) 0)` }}>
          <span><strong>{share(ready)}%</strong>ready</span>
        </div>
        <div>
          <p className="ceo-eyebrow">Executive view · data as of 14 Oct 2026</p>
          <h1>PMO command center</h1>
          <p className="muted">{ready} of {cases.length} people ready across {projects.length} projects</p>
          <div className="ceo-health" role="img" aria-label={health.map(([label, n]) => `${label}: ${n}`).join(', ')}>
            {health.map(([label, n, tone]) => <i key={label} className={tone} style={{ flexGrow: n }} />)}
          </div>
          <p className="ceo-legend">{health.map(([label, n, tone]) => <span key={label}><i className={tone} />{label} {n}</span>)}</p>
        </div>
        <div className="ceo-attention">
          <h3>Needs a decision</h3>
          {risk.slice(0, 3).map((c) => (
            <button type="button" key={c.case.id} onClick={() => onOpen(c.case.id)}>
              <strong>{c.case.employee}</strong>
              <span>{c.assessment.actions[0]?.ownerRole}: {c.assessment.actions[0]?.title}</span>
            </button>
          ))}
          {!risk.length && <p className="muted">Nothing is at risk.</p>}
        </div>
      </header>

      <section className="metrics">
        {kpis.map(([label, value, tone]) => (
          <button type="button" className={`card ${tone}`} key={label} onClick={() => pick(label)}
            aria-pressed={filters[label] ? filter === label : undefined}>
            {label}<strong>{value}</strong>
          </button>
        ))}
      </section>

      <div className="overview">
        <Attention cases={cases} onOpen={onOpen} onMore={() => { setFilter('Employees'); onPage('employees'); }} />
        <Projects cases={cases} onMore={() => onPage('projects')} />
        <Phases cases={cases} />
        <Requests cases={cases} staffing={staffing} onMore={() => onPage('requests')} />
      </div>
      </>}

      {page === 'employees' && filter !== 'Employees' && <button type="button" onClick={() => setFilter('Employees')}>Show all employees</button>}
      {page === 'employees' && <Table id="readiness" title={filter === 'Employees' ? 'Employee readiness' : `Employee readiness: ${filter.toLowerCase()} (${shown.length})`} empty="Nobody in this group."
        head={['Employee', 'Project', 'Phase', 'Progress', 'Readiness', 'Tracker says', 'Main problem', 'CV']}
        rows={shown.map((c) => {
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
        })} />}

      {page === 'projects' && <Table id="projects" title="Projects and teams" empty="No projects."
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
        })} />}

      {page === 'requests' && <Table id="requests" title="Additional Manager → HR: people requested for projects" empty="No people requested yet."
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
        ))} />}

      {page === 'line' && <Table id="line-manager" title="Line Manager: blockers, reports and reviews" empty="Nothing from the Line Manager yet."
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
                {!c.blockers.length && <span className="muted">No blocker recorded</span>}
              </td>
              <td>{report ? `${words(report.status)}: ${report.note}` : <span className="muted">No report</span>}</td>
              <td>{review ? `${words(review.rating)}: ${review.text}` : <span className="muted">-</span>}</td>
            </tr>
          );
        })} />}
    </div>
  );
}
