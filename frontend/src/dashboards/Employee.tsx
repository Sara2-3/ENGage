// Employee: only what the person needs at a glance (my action, who I am waiting for, my access
// and learning). Contacts, readiness and the update form are under "More details".
// An account counts only when the employee can use it (starter pack section 7).
import { useState } from 'react';
import Actions from '../Actions';
import { api, words } from '../api';
import { date, movement, Title, type Case } from '../shared';

const accessState: Record<string, { text: string; tone: string }> = {
  NOT_REQUESTED: { text: 'Not requested', tone: 'GREY' },
  REQUESTED: { text: 'Waiting', tone: 'AMBER' },
  APPROVED: { text: 'Please confirm', tone: 'AMBER' },
  USABLE: { text: 'Works', tone: 'GREEN' },
  UNKNOWN: { text: 'Unknown', tone: 'GREY' },
};

export default function Employee({ cases, who, onPick, onSaved }: {
  cases: Case[]; who: string; onPick: (id: string) => void; onSaved: () => void;
}) {
  const [note, setNote] = useState('');
  const c = cases.find((x) => x.case.id === who) ?? cases[0];
  if (!c) return null;
  const d = c.details;

  const next = c.assessment.actions.find((a) => a.ownerRole === 'Employee');
  const waiting = [
    ...c.assessment.actions.filter((a) => a.ownerRole !== 'Employee').map((a) => ({ who: a.ownerRole, what: a.title })),
    ...c.blockers.filter((b) => !b.resolved).map((b) => ({ who: b.owner ?? 'Unassigned', what: b.description })),
  ];
  const folder = d.docsLocation ?? c.evidence.map((e) => e.text.match(/\/Team\/[\w/]+/)?.[0]).find(Boolean);
  const facts: [string, string | null | undefined][] = [
    ['Exact role', d.role],
    ['Manager', c.case.manager],
    ['Line Manager', d.lineManager],
    ['Technical Lead', d.techLead],
    ['Additional Manager', d.ktOwner],
    ['Readiness review date', d.reviewDate],
    ['Documents folder', folder],
  ];
  const missingCount = facts.filter(([, value]) => !value).length;

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
        need={`${movement(c)} · project ${c.case.project ?? 'not assigned yet'} · started ${date(c.case.startDate)}`} />
      <label className="role">Signed in as (demo, no login)
        <select value={c.case.id} onChange={(e) => { setNote(''); onPick(e.target.value); }}>
          {cases.map((x) => <option key={x.case.id} value={x.case.id}>{x.case.employee}</option>)}
        </select>
      </label>

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

      <details className="card">
        <summary>More details{missingCount > 0 && ` (${missingCount} missing)`}</summary>
        <dl>
          {facts.map(([label, value]) => (
            <div className="item" key={label}>
              <dt className="muted">{label}</dt>
              <dd>{value ?? <span className="warn">Missing</span>}</dd>
            </div>
          ))}
        </dl>
        <h3>Send an update</h3>
        <Actions key={c.case.id} role="EMPLOYEE" data={{ ...c, asOf: '' }} onSaved={onSaved} />
      </details>
    </div>
  );
}
