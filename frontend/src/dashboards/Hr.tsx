// HR: did onboarding start correctly, and who can fill Management's requests for people.
// First view shows only what needs HR; the full list and new cases are folded away.
import { useState } from 'react';
import { api, type StaffingRequest } from '../api';
import NewCase from '../NewCase';
import { date, movement, Person, Title, type Case } from '../shared';

const problemCodes = ['STATUS_DATE_MISMATCH', 'MISSING_PROJECT', 'MISSING_MANAGER'];

// Why HR has to look at this case. Empty means onboarding started correctly.
const problems = (c: Case) => {
  const found = c.assessment.flags.filter((f) => problemCodes.includes(f.code)).map((f) => f.message);
  return found.length || c.stages[1].done ? found : ['Start is not confirmed.'];
};

function Request({ request, cases, onSaved }: { request: StaffingRequest; cases: Case[]; onSaved: () => void }) {
  // The pool: reallocations and people without a project, not already on this project.
  const pool = cases.filter((c) =>
    (c.case.movement === 'REALLOCATION' || !c.case.project) && c.case.project !== request.project);
  const [caseId, setCaseId] = useState('');
  const [note, setNote] = useState('');

  const fill = async () => {
    try {
      await api(`/staffing/${request.id}/fill`, { actorRole: 'HR', caseId });
      onSaved();
    } catch (error) { setNote((error as Error).message); }
  };

  return (
    <div className="request">
      <strong>{request.project}</strong>: {request.need}
      <div className="assign">
        <select value={caseId} onChange={(e) => setCaseId(e.target.value)} aria-label={`Employee for ${request.project}`}>
          <option value="">Choose an employee</option>
          {pool.map((c) => (
            <option key={c.case.id} value={c.case.id}>
              {c.case.employee} ({c.case.project ? `now on ${c.case.project}` : 'no project'})
            </option>
          ))}
        </select>
        <button className="primary" disabled={!caseId} onClick={fill}>Move to {request.project}</button>
      </div>
      <small>Skills and availability are not in the data. Confirm them before moving anyone.</small>
      {note && <p role="status">{note}</p>}
    </div>
  );
}

export default function Hr({ cases, staffing, onOpen, onCreated, onSaved }: {
  cases: Case[]; staffing: StaffingRequest[]; onOpen: (id: string) => void; onCreated: (id: string) => void; onSaved: () => void;
}) {
  const open = staffing.filter((s) => s.status === 'OPEN');
  const toCheck = cases.filter((c) => problems(c).length);

  return (
    <div className="narrow">
      <Title title="HR" need="Check that onboarding started correctly and give projects the people they need." />

      {open.length > 0 && (
        <section className="card now">
          <p className="eyebrow">Management is asking for people</p>
          {open.map((s) => <Request key={s.id} request={s} cases={cases} onSaved={onSaved} />)}
        </section>
      )}

      <section className="card">
        <h3>Needs your check ({toCheck.length})</h3>
        {toCheck.map((c) => (
          <div className="item" key={c.case.id}>
            <div>
              <Person name={c.case.employee} />
              {problems(c).map((p) => <small key={p}>{p}</small>)}
            </div>
            <button onClick={() => onOpen(c.case.id)}>Open</button>
          </div>
        ))}
        {!toCheck.length && <p className="muted">Everyone started correctly.</p>}
      </section>

      <details className="card">
        <summary>All employees ({cases.length})</summary>
        {[...cases].sort((a, b) => b.case.startDate.localeCompare(a.case.startDate)).map((c) => (
          <div className="item" key={c.case.id}>
            <Person name={c.case.employee} onOpen={() => onOpen(c.case.id)} />
            <span className="muted">{movement(c)} · {date(c.case.startDate)} · {c.case.project ?? 'No project'}</span>
          </div>
        ))}
      </details>

      <NewCase onCreated={onCreated} />
    </div>
  );
}
