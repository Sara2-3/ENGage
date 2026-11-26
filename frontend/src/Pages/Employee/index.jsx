// Employee: "My work" is what to do now; "My profile" is the own CV, the project assignment,
// every project status and the reviews from the levels above.
// An account counts only when the employee can use it (starter pack section 7).
import { useState } from 'react';
import Actions from '../../components/Actions';
import { words } from '../../Helper/format';
import Profile from '../../components/Profile';
import { date, movement, Title } from '../../Helper/shared';
import { add_record_service } from '../../Services/CaseService';
import { accessState } from '../../db/access';
import { useCaseContext } from '../../Context/CaseContext';

// Starter pack section 8
const levels = [
  ['Shadowing', 'you observe an experienced colleague and ask questions.'],
  ['Supported', 'you do the work while a colleague guides or reviews it.'],
  ['Independent', 'you do it without step-by-step support and know when to escalate.'],
  ['Ready with Support', 'you are operational, with occasional help on exceptions or complex cases.'],
  ['Partially Ready', 'you are autonomous for only part of the scope and need more practice.'],
];

const Employee = ({ page, who, onPick, onSaved }) => {
  const { cases } = useCaseContext();
  const [note, setNote] = useState('');
  const c = cases.find((x) => x.case.id === who) ?? cases[0];
  if (!c) return null;

  const next = c.assessment.actions.find((a) => a.ownerRole === 'Employee');
  const waiting = [
    ...c.assessment.actions.filter((a) => a.ownerRole !== 'Employee').map((a) => ({ who: a.ownerRole, what: a.title })),
    ...c.blockers.filter((b) => !b.resolved).map((b) => ({ who: b.owner ?? 'Unassigned', what: b.description })),
  ];

  const confirmUsable = async (system) => {
    try {
      await add_record_service(c.case.id, { type: 'ACCESS', actorRole: 'EMPLOYEE', payload: { system, state: 'USABLE' } });
      setNote(`Thank you. ${system} is recorded as working.`);
      onSaved();
    } catch (error) { setNote(error.message); }
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

          <section className="card">
            <h3>What the readiness levels mean</h3>
            {levels.map(([name, meaning]) => (
              <p key={name}><strong>{name}:</strong> {meaning}</p>
            ))}
            <p className="muted">Final readiness needs observed work and the Technical Lead&apos;s validation.</p>
          </section>
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
};

export default Employee;
