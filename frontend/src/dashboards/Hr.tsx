// HR: did onboarding start correctly, and who can fill Management's requests for people.
// New hires and reallocations are separate jobs: reallocations answer Management requests.
import { useState } from 'react';
import { api, type StaffingRequest } from '../api';
import NewCase from '../NewCase';
import { date, Person, Title, type Case } from '../shared';

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
  const [tab, setTab] = useState('NEW_HIRE');
  const open = staffing.filter((s) => s.status === 'OPEN');
  const ofType = (key: string) => cases.filter((c) => c.case.movement === key);
  // People HR still has to help come first.
  const people = ofType(tab).sort((a, b) => problems(b).length - problems(a).length);

  return (
    <div className="narrow">
      <Title title="HR" need="Help new hires start well, and move people to the projects that need them." />

      <div className="tabs" role="group" aria-label="Type of employee">
        <button aria-pressed={tab === 'NEW_HIRE'} onClick={() => setTab('NEW_HIRE')}>New hires ({ofType('NEW_HIRE').length})</button>
        <button aria-pressed={tab === 'REALLOCATION'} onClick={() => setTab('REALLOCATION')}>
          Reallocations ({ofType('REALLOCATION').length}){open.length > 0 && <span className="pill AMBER">{open.length} request{open.length > 1 ? 's' : ''}</span>}
        </button>
      </div>

      {tab === 'REALLOCATION' && (
        <section className="card now">
          <p className="eyebrow">Requests from Management</p>
          {open.map((s) => <Request key={s.id} request={s} cases={cases} onSaved={onSaved} />)}
          {!open.length && <p>No project is asking for people right now.</p>}
        </section>
      )}

      <section className="card">
        <h3>{tab === 'NEW_HIRE' ? 'Onboarding of new hires' : 'Onboarding after a move'}</h3>
        {people.map((c) => (
          <div className="item" key={c.case.id}>
            <div>
              <Person name={c.case.employee} onOpen={() => onOpen(c.case.id)} />
              <small>{c.case.project ?? 'No project'} · started {date(c.case.startDate)}</small>
            </div>
            {problems(c).length
              ? <span className="issue">{problems(c).join(' ')}</span>
              : <span className="pill GREEN">Started</span>}
          </div>
        ))}
      </section>

      <NewCase onCreated={onCreated} />
    </div>
  );
}
