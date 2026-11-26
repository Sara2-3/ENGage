// HR: did onboarding start correctly, and who can fill Management's requests for people.
// New hires and reallocations are separate jobs: reallocations answer Management requests.
import { useState } from 'react';
import { api, directionInfo, directions, words, type StaffingRequest } from '../api';
import CvLink from '../CvLink';
import Modal from '../Modal';
import NewCase from '../NewCase';
import { date, Person, requestState, Title, type Case } from '../shared';

const problemCodes = ['STATUS_DATE_MISMATCH', 'MISSING_PROJECT', 'MISSING_MANAGER'];

// Why HR has to look at this case. Empty means onboarding started correctly.
const problems = (c: Case) => {
  const found = c.assessment.flags.filter((f) => problemCodes.includes(f.code))
    .map((f) => (f.code === 'MISSING_PROJECT' ? 'Waiting for Management to assign a project.' : f.message));
  return found.length || c.stages[1].done ? found : ['Start is not confirmed.'];
};

function Request({ request, cases, onSaved }: { request: StaffingRequest; cases: Case[]; onSaved: () => void }) {
  // The pool: reallocations and people without a project, not already on this project.
  const pool = cases.filter((c) =>
    (c.case.movement === 'REALLOCATION' || !c.case.project) && c.case.project !== request.project);
  const [caseId, setCaseId] = useState('');
  const [note, setNote] = useState('');
  const [employee, setEmployee] = useState('');
  const [startDate, setStartDate] = useState(request.specs?.startDate ?? '');

  const hire = async () => {
    try {
      await api(`/staffing/${request.id}/hire`, { actorRole: 'HR', employee, startDate });
      onSaved();
    } catch (error) { setNote((error as Error).message); }
  };

  const fill = async () => {
    try {
      await api(`/staffing/${request.id}/fill`, { actorRole: 'HR', caseId });
      onSaved();
    } catch (error) { setNote((error as Error).message); }
  };

  return (
    <div className="request">
      <strong>{request.need}</strong> for {request.project}
      <dl className="specs">
        {request.specs?.direction && <><dt>Direction</dt><dd>{request.specs.direction}</dd></>}
        {request.specs?.skills && <><dt>Technical skills</dt><dd>{request.specs.skills}</dd></>}
        {request.specs?.level && <><dt>Level</dt><dd>{words(request.specs.level)}</dd></>}
        {request.specs?.startDate && <><dt>Needed from</dt><dd>{date(request.specs.startDate)}</dd></>}
        {request.specs?.notes && <><dt>Other</dt><dd>{request.specs.notes}</dd></>}
      </dl>
      {request.specs?.type === 'NEW_HIRE' ? (
        <div className="assign">
          <input value={employee} onChange={(e) => setEmployee(e.target.value)} placeholder="New employee name (fictional)" aria-label="New employee name" />
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} aria-label="Start date" />
          <button className="primary" disabled={!employee.trim() || !startDate} onClick={hire}>Send to Management</button>
        </div>
      ) : (
        <>
          <div className="assign">
            <select value={caseId} onChange={(e) => setCaseId(e.target.value)} aria-label={`Employee for ${request.project}`}>
              <option value="">Choose an employee</option>
              {pool.map((c) => (
                <option key={c.case.id} value={c.case.id}>
                  {c.case.employee} ({c.case.project ? `now on ${c.case.project}` : 'no project'})
                </option>
              ))}
            </select>
            <button className="primary" disabled={!caseId} onClick={fill}>Send to Management</button>
          </div>
          <small>Skills and availability are not in the data. Confirm them before moving anyone.</small>
        </>
      )}
      {note && <p role="status">{note}</p>}
    </div>
  );
}

// HR decides the direction and description, based on what the Additional Manager requires.
function Profile({ c, onSaved }: { c: Case; onSaved: () => void }) {
  const [direction, setDirection] = useState(c.case.direction ?? '');
  const [description, setDescription] = useState(c.details.description ?? '');
  const [note, setNote] = useState('');

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api(`/cases/${c.case.id}/events`, { type: 'PROFILE', actorRole: 'HR', payload: { direction, description } });
      setNote('Saved. The employee can now see it.');
      onSaved();
    } catch (error) { setNote((error as Error).message); }
  };

  return (
    <Modal title="Edit description">
      <p><strong>{c.case.employee}</strong></p>
      <p className="muted">Additional Manager requires:</p>
      <blockquote>{c.details.requirement ?? 'Nothing recorded yet.'}</blockquote>
      <form onSubmit={save}>
        <label>Direction
          <select value={direction} onChange={(e) => setDirection(e.target.value)}>
            <option value="">Not decided</option>
            {directions.map((x) => <option key={x}>{x}</option>)}
          </select>
        </label>
        <label>Description the employee sees
          <textarea rows={4} maxLength={500} value={description} onChange={(e) => setDescription(e.target.value)}
            placeholder={directionInfo[direction] ?? 'What this person will do and learn'} required />
        </label>
        <button className="primary" disabled={!description.trim()}>Save</button>
        {note && <p role="status">{note}</p>}
      </form>
    </Modal>
  );
}

export default function Hr({ cases, staffing, onOpen, onCreated, onSaved }: {
  cases: Case[]; staffing: StaffingRequest[]; onOpen: (id: string) => void; onCreated: (id: string) => void; onSaved: () => void;
}) {
  const [tab, setTab] = useState('NEW_HIRE');
  const open = staffing.filter((s) => s.status === 'OPEN');
  const asking = (key: string) => open.filter((s) => (s.specs?.type ?? 'REALLOCATION') === key);
  const badge = (key: string) => {
    const n = asking(key).length;
    return n > 0 && <span className="pill AMBER">{n} request{n > 1 ? 's' : ''}</span>;
  };
  const ofType = (key: string) => cases.filter((c) => c.case.movement === key);
  // People HR still has to help come first.
  const people = ofType(tab).sort((a, b) => problems(b).length - problems(a).length);

  return (
    <div className="narrow">
      <Title title="HR" need="Help new hires start well, and move people to the projects that need them." />

      <NewCase onCreated={onCreated} />

      <div className="tabs" role="group" aria-label="Type of employee">
        <button aria-pressed={tab === 'NEW_HIRE'} onClick={() => setTab('NEW_HIRE')}>New hires ({ofType('NEW_HIRE').length}){badge('NEW_HIRE')}</button>
        <button aria-pressed={tab === 'REALLOCATION'} onClick={() => setTab('REALLOCATION')}>
          Reallocations ({ofType('REALLOCATION').length}){badge('REALLOCATION')}
        </button>
      </div>

      <section className="card now">
        <p className="eyebrow">Requests from Additional Manager</p>
        {asking(tab).map((s) => <Request key={s.id} request={s} cases={cases} onSaved={onSaved} />)}
        {!asking(tab).length && <p>No {tab === 'NEW_HIRE' ? 'new-hire' : 'reallocation'} requests right now.</p>}
      </section>

      <h3>{tab === 'NEW_HIRE' ? 'New hires' : 'Reallocations'}</h3>
      <div className="people">
        {people.map((c) => (
          <article className="card person-card" key={c.case.id}>
            <Person name={c.case.employee} onOpen={() => onOpen(c.case.id)} />
            <small>{c.case.direction && `${c.case.direction} · `}{c.case.project ?? 'No project'} · started {date(c.case.startDate)}</small>
            {problems(c).length
              ? <span className="issue">{problems(c).join(' ')}</span>
              : <span className="pill GREEN">Started</span>}
            <dl>
              <dt>Additional Manager requires {requestState(c) === 'WAITING' && <span className="pill AMBER">New request</span>}</dt>
              <dd>{c.details.requirement ?? <span className="muted">Nothing yet</span>}</dd>
              <dt>Description</dt>
              <dd>{c.details.description ?? <span className="warn">Not written</span>}</dd>
            </dl>
            <CvLink c={c} role="HR" onSaved={onSaved} />
            <Profile c={c} onSaved={onSaved} />
          </article>
        ))}
      </div>

    </div>
  );
}
