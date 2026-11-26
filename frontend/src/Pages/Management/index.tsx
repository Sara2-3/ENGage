// Management (starter pack section 2): understand readiness, risks, delays and areas requiring
// intervention. Reads what the Additional Manager reports; changes nothing here.
import { words, type StaffingRequest } from '../api';
import CvLink from '../CvLink';
import { Attention, LatestReports, Phases, Projects } from '../OverviewPanels';
import { latest } from '../Reports';
import { Numbers, Table } from '../Table';
import { completed, date, Person, phase, Title, type Case } from '../shared';

const delayCodes = ['STALE_STATUS', 'UNANSWERED_REQUEST', 'STATUS_DATE_MISMATCH', 'NO_REVIEW_DATE'];

export default function Executive({ page, onPage, cases, staffing, onOpen }: {
  page: string; onPage: (key: string) => void; cases: Case[]; staffing: StaffingRequest[]; onOpen: (id: string) => void;
}) {
  const projects = [...new Set([...cases.flatMap((c) => (c.case.project ? [c.case.project] : [])), ...staffing.map((s) => s.project)])].sort();
  const atRisk = cases.filter((c) => c.assessment.colour === 'RED');
  const delayed = cases.filter((c) => c.assessment.flags.some((f) => delayCodes.includes(f.code)));
  const reports = cases
    .flatMap((c) => {
      const report = latest(c, 'ADDITIONAL_MANAGER');
      return report ? [{ c, report }] : [];
    })
    .sort((a, b) => Number(b.report.status === 'NEEDS_HELP') - Number(a.report.status === 'NEEDS_HELP'));

  const person = (c: Case) => <td><Person name={c.case.employee} onOpen={() => onOpen(c.case.id)} /></td>;
  const project = (c: Case) => <td>{c.case.project ?? <span className="warn">None</span>}</td>;

  return (
    <div className="wide">
      <Title title="Management" need="Readiness, risks, delays and where to step in." />

      {page === 'overview' && <Numbers onGo={onPage} items={[
        { label: 'Ready', value: cases.filter(completed).length, tone: 'green', target: 'projects' },
        { label: 'Need intervention', value: atRisk.length, tone: 'red', target: 'intervention' },
        { label: 'Delayed', value: delayed.length, tone: 'amber', target: 'intervention' },
        { label: 'Reports asking for help', value: reports.filter((r) => r.report.status === 'NEEDS_HELP').length, tone: 'red', target: 'reports' },
        { label: 'Open requests to HR', value: staffing.filter((s) => !s.specs?.assigned).length, tone: 'amber', target: 'requests' },
        { label: 'Projects', value: projects.length, target: 'projects' },
      ]} />}

      {page === 'overview' && (
        <div className="overview">
          <Attention cases={cases} onOpen={onOpen} onMore={() => onPage('intervention')} />
          <Projects cases={cases} onMore={() => onPage('projects')} />
          <LatestReports cases={cases} onOpen={onOpen} onMore={() => onPage('reports')} />
          <Phases cases={cases} />
        </div>
      )}

      {page === 'intervention' && <Table id="intervention" title="Needs intervention" empty="Nothing needs intervention."
        head={['Employee', 'Project', 'Risk', 'Next action', 'Owner', 'CV']}
        rows={atRisk.map((c) => (
          <tr key={c.case.id}>
            {person(c)}
            {project(c)}
            <td>{c.assessment.flags[0]?.message}</td>
            <td>{c.assessment.actions[0]?.title ?? '-'}</td>
            <td>{c.assessment.actions[0]?.ownerRole ?? '-'}</td>
            <td><CvLink c={c} role="MANAGEMENT" /></td>
          </tr>
        ))} />}

      {page === 'intervention' && <Table id="delays" title="Delays" empty="No delays."
        head={['Employee', 'Project', 'What is late or outdated', 'Last update', 'Phase']}
        rows={delayed.map((c) => (
          <tr key={c.case.id}>
            {person(c)}
            {project(c)}
            <td>{c.assessment.flags.filter((f) => delayCodes.includes(f.code)).map((f) => <small key={f.code}>{f.message}</small>)}</td>
            <td className="nowrap">{date(c.case.lastUpdate)}</td>
            <td>{phase(c)}</td>
          </tr>
        ))} />}

      {page === 'reports' && <Table id="reports" title="Reports from Additional Manager" empty="No reports yet."
        head={['Employee', 'Project', 'Status', 'Report', 'Date']}
        rows={reports.map(({ c, report }) => (
          <tr key={c.case.id}>
            {person(c)}
            {project(c)}
            <td><span className={`pill ${report.status === 'NEEDS_HELP' ? 'RED' : 'GREEN'}`}>{words(report.status)}</span></td>
            <td>{report.note}</td>
            <td className="nowrap">{date(report.date)}</td>
          </tr>
        ))} />}

      {page === 'projects' && <Table id="projects" title="Readiness by project" empty="No projects."
        head={['Project', 'Employees', 'Ready', 'At risk', 'People still needed', 'CVs']}
        rows={projects.map((p) => {
          const team = cases.filter((c) => c.case.project === p);
          const ready = team.filter(completed).length;
          const risk = team.filter((c) => c.assessment.colour === 'RED').length;
          const needed = staffing.filter((s) => s.project === p && !s.specs?.assigned).length;
          return (
            <tr key={p}>
              <td><strong>{p}</strong></td>
              <td>{team.map((c) => c.case.employee).join(', ') || <span className="muted">Nobody yet</span>}</td>
              <td className="nowrap"><progress max={team.length || 1} value={ready} aria-label={`${ready} of ${team.length} ready`} /> {ready}/{team.length}</td>
              <td>{risk ? <span className="pill RED">{risk}</span> : <span className="muted">0</span>}</td>
              <td>{needed ? <span className="pill AMBER">{needed}</span> : <span className="muted">0</span>}</td>
              <td>{team.map((c) => <div key={c.case.id}><CvLink c={c} role="MANAGEMENT" /></div>)}</td>
            </tr>
          );
        })} />}

      {page === 'requests' && <Table id="requests" title="People requested from HR" empty="No people requested yet."
        head={['Project', 'Role', 'Skills', 'Person', 'Status']}
        rows={staffing.map((s) => {
          const found = cases.find((c) => c.case.id === s.caseId);
          return (
            <tr key={s.id}>
              <td><strong>{s.project}</strong></td>
              <td>{s.need}</td>
              <td>{s.specs?.skills}</td>
              <td>{found ? <Person name={found.case.employee} onOpen={() => onOpen(found.case.id)} /> : <span className="muted">Not found yet</span>}</td>
              <td><span className={`pill ${s.specs?.assigned ? 'GREEN' : 'AMBER'}`}>{!s.caseId ? 'Waiting for HR' : s.specs?.assigned ? 'Assigned' : 'Found by HR'}</span></td>
            </tr>
          );
        })} />}
    </div>
  );
}
