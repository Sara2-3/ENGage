// People who still need a project: found by HR for a request, or simply without one.
// Only the Additional Manager assigns them.
import AssignProject from '../AssignProject';
import CvLink from '../CvLink';
import { Person } from '../../Helper/shared';

const WaitingProject = ({ cases, staffing, onOpen, onSaved }) => {
  const waiting = cases.flatMap((c) => {
    const request = staffing.find((s) => s.caseId === c.case.id && !s.specs?.assigned);
    return request || !c.case.project ? [{ c, request }] : [];
  });
  return (
    <section className="card">
      <h3>Waiting for a project ({waiting.length})</h3>
      {waiting.map(({ c, request }) => (
        <div className="item" key={c.case.id}>
          <div className="grow">
            <Person name={c.case.employee} onOpen={() => onOpen(c.case.id)} />
            <small>{request ? `Found by HR for ${request.project} · ${request.need}` : c.case.direction ?? 'Reallocation'}</small>
          </div>
          <CvLink c={c} role="ADDITIONAL_MANAGER" />
          <AssignProject key={request?.id ?? 'none'} caseId={c.case.id} name={c.case.employee}
            requestId={request?.id} project={request?.project} role={request?.need} onSaved={onSaved} />
        </div>
      ))}
      {!waiting.length && <p className="muted">Nobody is waiting for a project.</p>}
    </section>
  );
};

export default WaitingProject;
