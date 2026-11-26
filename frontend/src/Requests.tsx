// Everything that is being asked of HR, for the PMO.
import type { StaffingRequest } from './api';
import { Person, requestState, type Case } from './shared';

export default function Requests({ cases, staffing }: { cases: Case[]; staffing: StaffingRequest[] }) {
  const requirements = cases.filter((c) => requestState(c));
  const waiting = requirements.filter((c) => requestState(c) === 'WAITING').length + staffing.filter((s) => !s.caseId).length;
  const name = (id: string) => cases.find((c) => c.case.id === id)?.case.employee ?? id;

  return (
    <section className="card">
      <h3>Requests to HR ({waiting} waiting)</h3>

      <h4>About an employee, from Additional Manager</h4>
      {requirements.map((c) => (
        <div className="item" key={c.case.id}>
          <div className="grow">
            <Person name={c.case.employee} />
            <small>{c.details.requirement}</small>
          </div>
          <span className={`pill ${requestState(c) === 'WAITING' ? 'AMBER' : 'GREEN'}`}>
            {requestState(c) === 'WAITING' ? 'Waiting for HR' : 'Answered by HR'}
          </span>
        </div>
      ))}
      {!requirements.length && <p className="muted">No requests yet.</p>}

      <h4>People requested by Additional Manager</h4>
      {staffing.map((s) => (
        <div className="item" key={s.id}>
          <div className="grow">
            <strong>{s.need}</strong> for {s.project}
            <small>
              {s.specs?.type === 'NEW_HIRE' ? 'New hire' : 'From the company'}
              {s.specs?.skills && ` · ${s.specs.skills}`}
              {s.caseId && ` · ${name(s.caseId)}`}
            </small>
          </div>
          <span className={`pill ${!s.caseId ? 'AMBER' : 'GREEN'}`}>
            {!s.caseId ? 'Waiting for HR' : s.specs?.assigned ? 'Assigned to project' : 'Person found'}
          </span>
        </div>
      ))}
      {!staffing.length && <p className="muted">No requests yet.</p>}
    </section>
  );
}
