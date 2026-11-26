// Management: knows all company projects and puts the people HR finds on them.
import type { StaffingRequest } from '../api';
import AssignProject from '../AssignProject';
import CvLink from '../CvLink';
import { Inbox } from '../Reports';
import { Person, Title, type Case } from '../shared';

export default function Executive({ cases, staffing, onOpen, onSaved }: {
  cases: Case[]; staffing: StaffingRequest[]; onOpen: (id: string) => void; onSaved: () => void;
}) {
  const projects = [...new Set([
    ...cases.flatMap((c) => (c.case.project ? [c.case.project] : [])),
    ...staffing.map((s) => s.project),
  ])].sort();
  const urgent = cases.filter((c) => c.assessment.colour === 'RED');
  // People without a project who are not already listed under a request.
  const unassigned = cases.filter((c) => !c.case.project && !staffing.some((s) => s.caseId === c.case.id && !s.specs?.assigned));
  const name = (id: string | null) => cases.find((c) => c.case.id === id)?.case.employee;

  return (
    <div className="narrow">
      <Title title="Management" need="Review what the Additional Manager reports, assign people to projects and see what is at risk." />

      <Inbox cases={cases} from="ADDITIONAL_MANAGER" title="Reports from Additional Manager" />

      {staffing.length > 0 && (
        <section className="card">
          <h3>People requested from HR</h3>
          {staffing.map((s) => (
            <div className="item" key={s.id}>
              <div className="grow">
                {s.caseId
                  ? <Person name={name(s.caseId) ?? s.caseId} onOpen={() => onOpen(s.caseId!)} />
                  : <strong>{s.need}</strong>}
                {cases.filter((c) => c.case.id === s.caseId).map((c) => <small key={c.case.id}><CvLink c={c} role="MANAGEMENT" /></small>)}
                <small>{s.project} · {s.need}{s.specs?.skills && ` · ${s.specs.skills}`}</small>
              </div>
              {!s.caseId && <span className="pill AMBER">Waiting for HR</span>}
              {s.caseId && s.specs?.assigned && <span className="pill GREEN">Assigned</span>}
              {s.caseId && !s.specs?.assigned && (
                <>
                  <span className="pill AMBER">Found by HR</span>
                  <AssignProject caseId={s.caseId} name={name(s.caseId) ?? s.caseId} requestId={s.id}
                    project={s.project} role={s.need} onSaved={onSaved} />
                </>
              )}
            </div>
          ))}
        </section>
      )}

      {unassigned.length > 0 && (
        <section className="card">
          <h3>Waiting for a project ({unassigned.length})</h3>
          {unassigned.map((c) => (
            <div className="item" key={c.case.id}>
              <div className="grow">
                <Person name={c.case.employee} onOpen={() => onOpen(c.case.id)} />
                <small>{c.case.direction ?? 'Reallocation'}</small>
              </div>
              <AssignProject caseId={c.case.id} name={c.case.employee} onSaved={onSaved} />
            </div>
          ))}
        </section>
      )}

      <section className="card">
        <h3>At risk ({urgent.length})</h3>
        {urgent.map((c) => (
          <div className="item" key={c.case.id}>
            <div className="grow">
              <Person name={c.case.employee} onOpen={() => onOpen(c.case.id)} />
              <small>{c.assessment.flags[0]?.message}</small>
            </div>
          </div>
        ))}
        {!urgent.length && <p className="muted">Nothing is at risk.</p>}
      </section>

      <details className="card">
        <summary>Employee CVs ({cases.filter((c) => c.hasCv).length})</summary>
        {cases.map((c) => (
          <div className="item" key={c.case.id}>
            <div className="grow"><Person name={c.case.employee} /></div>
            <CvLink c={c} role="MANAGEMENT" />
          </div>
        ))}
      </details>

      <details className="card">
        <summary>All projects ({projects.length})</summary>
        {projects.map((p) => (
          <div className="item" key={p}>
            <strong>{p}</strong>
            <span className="muted">{cases.filter((c) => c.case.project === p).map((c) => c.case.employee).join(', ') || 'Nobody yet'}</span>
          </div>
        ))}
      </details>
    </div>
  );
}
