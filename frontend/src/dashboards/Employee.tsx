// Employee (starter pack section 2): role, contacts, access, learning activities, pending actions
// and readiness expectations. Access states follow section 7, readiness section 8.
import { useState } from 'react';
import Actions from '../Actions';
import { api, words } from '../api';
import { date, List, Metrics, movement, Title, type Case } from '../shared';

const blockerCodes = ['ACCESS_NOT_USABLE', 'BLOCKED_NO_DETAIL', 'UNANSWERED_REQUEST'];
const accessText: Record<string, { text: string; tone: string }> = {
  NOT_REQUESTED: { text: 'Not requested', tone: 'GREY' },
  REQUESTED: { text: 'Requested', tone: 'AMBER' },
  APPROVED: { text: 'Approved, not confirmed', tone: 'AMBER' },
  USABLE: { text: 'Usable', tone: 'GREEN' },
  UNKNOWN: { text: 'Unknown', tone: 'GREY' },
};

export default function Employee({ cases, who, onPick, onSaved }: {
  cases: Case[]; who: string; onPick: (id: string) => void; onSaved: () => void;
}) {
  const [note, setNote] = useState('');
  const c = cases.find((x) => x.case.id === who) ?? cases[0];
  if (!c) return null;
  const d = c.details;
  const known = (v?: string | null) => v ?? 'Not recorded yet';

  const mine = c.assessment.actions
    .filter((a) => a.ownerRole === 'Employee')
    .map((a) => a.title.replace('Confirm the employee can use', 'Confirm you can use'));
  const waiting = c.assessment.actions
    .filter((a) => a.ownerRole !== 'Employee')
    .map((a) => `${a.title} (${a.ownerRole})`);
  const blockers = [
    ...c.blockers.filter((b) => !b.resolved).map((b) => `${b.description}. Owner: ${b.owner ?? 'unassigned'}`),
    ...c.assessment.flags.filter((f) => blockerCodes.includes(f.code)).map((f) => f.message),
  ];
  const folder = d.docsLocation ?? c.evidence.map((e) => e.text.match(/\/Team\/[\w/]+/)?.[0]).find(Boolean);
  const validated = c.stages[c.stages.length - 1].done;

  const confirmUsable = async (system: string) => {
    try {
      await api(`/cases/${c.case.id}/events`, { type: 'ACCESS', actorRole: 'EMPLOYEE', payload: { system, state: 'USABLE' } });
      setNote(`Thank you. ${system} is recorded as usable.`);
      onSaved();
    } catch (error) { setNote((error as Error).message); }
  };

  return (
    <>
      <Title title="My onboarding" need="Your role, contacts, access, learning, pending actions and what is expected for readiness." />
      <label className="role">Signed in as (demo, no login)
        <select value={c.case.id} onChange={(e) => { setNote(''); onPick(e.target.value); }}>
          {cases.map((x) => <option key={x.case.id} value={x.case.id}>{x.case.employee}</option>)}
        </select>
      </label>

      <Metrics items={[
        { title: 'My actions', value: mine.length, tone: mine.length ? 'amber' : 'green' },
        { title: 'Open blockers', value: blockers.length, tone: blockers.length ? 'red' : 'green' },
        { title: 'Systems not usable yet', value: c.access.filter((a) => a.state !== 'USABLE').length, tone: 'amber' },
        { title: 'Learning activities', value: c.activities.length },
      ]} />

      <div className="columns">
        <div>
          <section className="card">
            <h3>My role</h3>
            <h2>{c.case.employee}</h2>
            <p>{movement(c)} · project {known(c.case.project)} · started {date(c.case.startDate)}</p>
            <p className="muted">Exact role: {known(d.role)}</p>
          </section>

          <section className="card">
            <h3>My actions</h3>
            {mine.length ? <List items={mine} /> : <p className="muted">Nothing for you to do right now.</p>}
            <h3>Waiting on others</h3>
            <List items={waiting} />
          </section>

          <section className="card">
            <h3>My access</h3>
            {c.access.length ? (
              <div className="table">
                <table className="static">
                  <thead><tr><th>System</th><th>State</th><th>Requested</th><th>Owner</th><th>Follow-up</th><th></th></tr></thead>
                  <tbody>
                    {c.access.map((a) => (
                      <tr key={a.system}>
                        <td>{a.system}<small>{a.note}</small></td>
                        <td><span className={`pill ${accessText[a.state].tone}`}>{accessText[a.state].text}</span></td>
                        <td>{a.requestedOn ? date(a.requestedOn, false) : '-'}</td>
                        <td>{a.owner ?? 'Unassigned'}</td>
                        <td>{a.nextFollowUp ? date(a.nextFollowUp, false) : 'Not set'}</td>
                        <td>{a.state !== 'USABLE' && <button onClick={() => confirmUsable(a.system)}>I can use it</button>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : <p className="muted">No access information recorded yet.</p>}
            <p className="muted">An account counts only when you can use it. Never write passwords here.</p>
            {note && <p role="status">{note}</p>}
          </section>

          <section className="card">
            <h3>My learning</h3>
            <List items={c.activities.map((a) => `${a.name}: ${words(a.level)}${a.validatedByTechOwner ? ' (validated)' : ' (not validated)'}`)} />
            {!c.activities.length && <p className="muted">No activities recorded yet.</p>}
          </section>

          <section className="card">
            <h3>What is blocking me</h3>
            <List items={blockers} />
            {!blockers.length && <p className="muted">No open blockers recorded.</p>}
          </section>
        </div>

        <div>
          <section className="card">
            <h3>My contacts</h3>
            <p>Manager: {known(c.case.manager)}</p>
            <p>Line Manager: {known(d.lineManager)}</p>
            <p>Technical Lead: {known(d.techLead)}</p>
            <p>Additional Manager (KT Owner): {known(d.ktOwner)}</p>
          </section>

          <section className="card">
            <h3>My readiness</h3>
            <p>Status in tracker: <strong>{c.case.trackerStatus}</strong></p>
            <p>
              <span className={`pill ${validated ? 'GREEN' : 'AMBER'}`}>
                {validated ? 'Validated by the Technical Lead' : 'No validation recorded in ENGage'}
              </span>
            </p>
            <p className="muted">Expected review date: {d.reviewDate ?? 'Not set yet'}</p>
            <ul>
              <li><strong>Shadowing:</strong> you observe and ask questions.</li>
              <li><strong>Supported:</strong> you do the work with guidance.</li>
              <li><strong>Independent:</strong> you work without step-by-step help and know when to escalate.</li>
              <li><strong>Ready with Support:</strong> operational, with occasional help on complex cases.</li>
              <li><strong>Partially Ready:</strong> independent for part of the scope only.</li>
            </ul>
            <p className="muted">Final readiness needs observed work and technical-owner validation.</p>
          </section>

          <section className="card">
            <h3>My documents</h3>
            <p>{folder ?? 'No folder recorded yet.'}</p>
            <p className="muted">Documents stay in the project folder; only the location is kept here.</p>
          </section>

          <section className="card">
            <h3>Send an update</h3>
            <p className="muted">Check-in, progress or blocker.</p>
            <Actions key={c.case.id} role="EMPLOYEE" data={{ ...c, asOf: '' }} onSaved={onSaved} />
          </section>
        </div>
      </div>
    </>
  );
}
