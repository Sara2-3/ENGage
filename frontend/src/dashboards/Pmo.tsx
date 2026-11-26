// PMO: the highest view, read only. One overview of all the work, in two parts:
// by project and by employee. Technical work (the Technical Lead's) is not shown.
import { words, type StaffingRequest } from '../api';
import CvLink from '../CvLink';
import { above, latest } from '../Reports';
import { completed, movement, Person, phase, requestState, Title, type Case } from '../shared';

const reporters = [['ADDITIONAL_MANAGER', 'Additional Manager'], ['LINE_MANAGER', 'Line Manager']];

const status = (c: Case) => (
  <span className={`pill ${completed(c) ? 'GREEN' : c.assessment.colour === 'RED' ? 'RED' : 'GREY'}`}>
    {completed(c) ? 'Completed' : c.assessment.colour === 'RED' ? 'At risk' : 'In progress'}
  </span>
);

function Project({ name, members, requests }: { name: string; members: Case[]; requests: StaffingRequest[] }) {
  const done = members.filter(completed).length;
  return (
    <section className="card">
      <div className="item-head">
        <h3>{name}</h3>
        <span className="muted">{done} of {members.length} completed</span>
      </div>
      {members.map((c) => (
        <div className="item" key={c.case.id}>
          <div className="grow">
            <strong>{c.case.employee}</strong>
            <small>{phase(c)}</small>
          </div>
          {status(c)}
        </div>
      ))}
      {requests.map((s) => (
        <div className="item" key={s.id}>
          <div className="grow">
            Request: {s.need}
            {s.specs?.skills && <small>{s.specs.skills}</small>}
          </div>
          <span className={`pill ${s.specs?.assigned ? 'GREEN' : 'AMBER'}`}>
            {!s.caseId ? 'Waiting for HR' : s.specs?.assigned ? 'Assigned' : 'Person found'}
          </span>
        </div>
      ))}
    </section>
  );
}

function Employee({ c, onOpen }: { c: Case; onOpen: (id: string) => void }) {
  return (
    <section className="card">
      <div className="item-head">
        <Person name={c.case.employee} onOpen={() => onOpen(c.case.id)} />
        {status(c)}
      </div>
      <small>{movement(c)} · {c.case.project ?? 'No project'} · {phase(c)}</small>
      {c.assessment.flags[0] && <small className="problem">{c.assessment.flags[0].message}</small>}
      {requestState(c) && (
        <small>
          Request to HR: {c.details.requirement} ({requestState(c) === 'WAITING' ? 'waiting' : 'answered'})
        </small>
      )}
      {reporters.map(([role, name]) => {
        const report = latest(c, role);
        return report && <small key={role}>{name} to {above[role]}: {words(report.status)}. {report.note}</small>;
      })}
      <small><CvLink c={c} role="PMO" /></small>
    </section>
  );
}

export default function Pmo({ cases, staffing, onOpen }: { cases: Case[]; staffing: StaffingRequest[]; onOpen: (id: string) => void }) {
  const done = cases.filter(completed).length;
  const projects = [...new Set([
    ...cases.flatMap((c) => (c.case.project ? [c.case.project] : [])),
    ...staffing.map((s) => s.project),
  ])].sort();
  const noProject = cases.filter((c) => !c.case.project);

  return (
    <div className="wide">
      <Title title="PMO overview" need={`${done} completed · ${cases.length - done} in progress · ${projects.length} projects`} />
      <div className="halves">
        <div>
          <h2>By project</h2>
          {projects.map((p) => (
            <Project key={p} name={p} members={cases.filter((c) => c.case.project === p)}
              requests={staffing.filter((s) => s.project === p)} />
          ))}
          {noProject.length > 0 && <Project name="No project yet" members={noProject} requests={[]} />}
        </div>
        <div>
          <h2>By employee</h2>
          {cases.map((c) => <Employee key={c.case.id} c={c} onOpen={onOpen} />)}
        </div>
      </div>
    </div>
  );
}
