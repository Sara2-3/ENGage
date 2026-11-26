// HR: helps with onboarding, and fills Management's requests for people.
import { useState } from 'react';
import { api, type StaffingRequest } from '../api';
import NewCase from '../NewCase';
import { date, has, Metrics, missing, movement, Table, Title, type Case } from '../shared';

const started = (c: Case) => {
  if (has(c, 'STATUS_DATE_MISMATCH')) return { text: 'Check: not started?', tone: 'AMBER' };
  if (has(c, 'MISSING_PROJECT', 'MISSING_MANAGER')) return { text: 'Information missing', tone: 'AMBER' };
  return c.stages[1].done ? { text: 'Started', tone: 'GREEN' } : { text: 'Not confirmed', tone: 'GREY' };
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
      <p className="muted">Skills and availability are not in the data. Confirm them before moving anyone.</p>
      {note && <p role="status">{note}</p>}
    </div>
  );
}

export default function Hr({ cases, staffing, onOpen, onCreated, onSaved }: {
  cases: Case[]; staffing: StaffingRequest[]; onOpen: (id: string) => void; onCreated: (id: string) => void; onSaved: () => void;
}) {
  const open = staffing.filter((s) => s.status === 'OPEN');
  return (
    <>
      <Title title="HR" need="Help employees through onboarding and provide people for Management's projects." />
      <Metrics items={[
        { title: 'New hires', value: cases.filter((c) => c.case.movement === 'NEW_HIRE').length },
        { title: 'Reallocations', value: cases.filter((c) => c.case.movement === 'REALLOCATION').length },
        { title: 'Requests from Management', value: open.length, tone: 'amber' },
        { title: 'Onboarding to check', value: cases.filter((c) => started(c).tone !== 'GREEN').length, tone: 'amber' },
      ]} />
      <section className="card">
        <h3>Requests from Management</h3>
        {open.map((s) => <Request key={s.id} request={s} cases={cases} onSaved={onSaved} />)}
        {!open.length && <p className="muted">No open requests.</p>}
      </section>
      <Table title="Onboarding start and movement" head={['Movement', 'Start', 'Project', 'Manager', 'Started correctly?']} onOpen={onOpen}
        cases={[...cases].sort((a, b) => b.case.startDate.localeCompare(a.case.startDate))}
        cells={(c) => [
          movement(c), date(c.case.startDate), c.case.project ?? missing, c.case.manager ?? missing,
          <span className={`pill ${started(c).tone}`}>{started(c).text}</span>,
        ]} />
      <NewCase onCreated={onCreated} />
    </>
  );
}
