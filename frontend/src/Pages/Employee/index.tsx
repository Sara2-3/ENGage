// Employee: "My work" is what to do now; "My profile" is the own CV, the project assignment,
// every project status and the reviews from the levels above.
// An account counts only when the employee can use it (starter pack section 7).
import { useState } from 'react';
import Actions from '../Actions';
import { api, words } from '../api';
import Profile from '../Profile';
import { date, movement, Title, type Case } from '../shared';

export const accessState: Record<string, { text: string; tone: string }> = {
  NOT_REQUESTED: { text: 'Not requested', tone: 'GREY' },
  REQUESTED: { text: 'Waiting', tone: 'AMBER' },
  APPROVED: { text: 'Please confirm', tone: 'AMBER' },
  USABLE: { text: 'Works', tone: 'GREEN' },
  UNKNOWN: { text: 'Unknown', tone: 'GREY' },
};

export default function Employee({ page, cases, who, onPick, onSaved }: {
  page: string; cases: Case[]; who: string; onPick: (id: string) => void; onSaved: () => void;
}) {
  const [note, setNote] = useState('');
  const c = cases.find((x) => x.case.id === who) ?? cases[0];
  if (!c) return null;

  const next = c.assessment.actions.find((a) => a.ownerRole === 'Employee');
  const waiting = [
    ...c.assessment.actions.filter((a) => a.ownerRole !== 'Employee').map((a) => ({ who: a.ownerRole, what: a.title })),
    ...c.blockers.filter((b) => !b.resolved).map((b) => ({ who: b.owner ?? 'Unassigned', what: b.description })),
  ];

  const confirmUsable = async (system: string) => {
    try {
      await api(`/cases/${c.case.id}/events`, { type: 'ACCESS', actorRole: 'EMPLOYEE', payload: { system, state: 'USABLE' } });
      setNote(`Thank you. ${system} is recorded as working.`);
      onSaved();
    } catch (error) { setNote((error as Error).message); }
  };

  return (
    <div className="narrow">
      <Title title={`Hello, ${c.case.employee.split(' ')[0]}`}
        need={`${movement(c)}${c.case.direction ? ` · ${c.case.direction}` : ''} · project ${c.case.project ?? 'not assigned yet'} · started ${date(c.case.startDate)}`} />
      <label className="role">Viewing as (demo)
        <select value={c.case.id} onChange={(e) => { setNote(''); onPick(e.target.value); }}>
          {[['NEW_HIRE', 'New hires'], ['REALLOCATION', 'Reallocations']].map(([type, label]) => (
            <optgroup key={type} label={label}>
              {cases.filter((x) => x.case.movement === type).map((x) => (
                <option key={x.case.id} value={x.case.id}>{x.case.employee}{x.case.direction && ` · ${x.case.direction}`}</option>
              ))}
            </optgroup>
          ))}
        </select>
      </label>

      {page === 'profile' && <Profile c={c} onSaved={onSaved} />}

      {page === 'work' && (
        <>
          <section className="card now">
            <p className="eyebrow">What you do now</p>
            <h2>{next ? next.title.replace('Confirm the employee can use', 'Check that you can use') : 'Nothing for you right now'}</h2>
            {waiting.length > 0 && (
              <ul>
                {waiting.map((w) => <li key={w.what}><strong>{w.who}:</strong> {w.what}</li>)}
              </ul>
            )}
          </section>

          {c.access.length > 0 && (
            <section className="card">
              <h3>My access</h3>
              {c.access.map((a) => (
                <div className="item" key={a.system}>
                  <strong>{a.system}</strong>
                  <span className="item-end">
                    <span className={`pill ${accessState[a.state].tone}`}>{accessState[a.state].text}</span>
                    {a.state !== 'USABLE' && <button onClick={() => confirmUsable(a.system)}>It works</button>}
                  </span>
                </div>
              ))}
              {note && <p role="status">{note}</p>}
            </section>
          )}

          {c.activities.length > 0 && (
            <section className="card">
              <h3>My learning</h3>
              {c.activities.map((a) => (
                <div className="item" key={a.name}>
                  <strong>{a.name}</strong>
                  <span className={`pill ${a.level === 'INDEPENDENT' ? 'GREEN' : 'GREY'}`}>{words(a.level)}</span>
                </div>
              ))}
            </section>
          )}

        </>
      )}

      {page === 'update' && (
        <section className="card">
          <h3>Send an update</h3>
          <Actions key={c.case.id} role="EMPLOYEE" data={{ ...c, asOf: '' }} onSaved={onSaved} />
        </section>
      )}
    </div>
  );
}
