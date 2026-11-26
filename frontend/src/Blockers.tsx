// Practical blockers: concrete things that stop someone from working (missing access, a request
// with no answer, an unexplained "Blocked"). Learning gaps are not blockers: those belong to the
// Technical Lead. Each blocker gets an owner and a follow-up date and is followed to closure.
import Actions from './Actions';
import Modal from './Modal';
import { date, Person, type Case } from './shared';

const codes = ['OPEN_BLOCKER', 'BLOCKED_NO_DETAIL', 'ACCESS_NOT_USABLE', 'UNANSWERED_REQUEST'];

export default function Blockers({ cases, onSaved }: { cases: Case[]; onSaved: () => void }) {
  const blocked = cases.filter((c) => c.blockers.some((b) => !b.resolved) || c.assessment.flags.some((f) => codes.includes(f.code)));

  return (
    <section className="card">
      <h3>Practical blockers to remove ({blocked.length})</h3>
      <p className="muted">1. Give it an owner and a follow-up date. 2. Follow it up. 3. Close it.</p>
      {blocked.map((c) => {
        const open = c.blockers.filter((b) => !b.resolved);
        const problems = c.assessment.flags.filter((f) => codes.includes(f.code) && f.code !== 'OPEN_BLOCKER');
        const has = (code: string) => problems.some((f) => f.code === code);
        return (
          <div className="item" key={c.case.id}>
            <div className="grow">
              <Person name={c.case.employee} />
              {problems.map((f) => <small className="problem" key={f.code}>{f.message}</small>)}
              {c.assessment.actions.filter((a) => a.ownerRole === 'Line Manager').map((a) => <small key={a.title}>Next: {a.title}</small>)}
              {open.map((b) => (
                <small key={b.description}>
                  <strong>{b.description}</strong> · Owner: {b.owner ?? 'unassigned'}
                  {' '}· Follow-up: {b.nextFollowUp ? date(b.nextFollowUp, false) : 'not set'}
                </small>
              ))}
              {has('ACCESS_NOT_USABLE') && <small>The access problem closes when the employee confirms it works.</small>}
            </div>
            <Modal title="Assign owner and date">
              <p>Blocker for <strong>{c.case.employee}</strong>.</p>
              <Actions data={{ ...c, asOf: '' }} role="LINE_MANAGER" only="BLOCKER" initial={{ description: problems[0]?.message ?? '' }} onSaved={onSaved} />
            </Modal>
            {has('UNANSWERED_REQUEST') && (
              <Modal title="Record answer">
                <Actions data={{ ...c, asOf: '' }} role="LINE_MANAGER" only="REQUEST_ANSWERED" onSaved={onSaved} />
              </Modal>
            )}
            {open.length > 0 && (
              <Modal title="Resolve">
                <p>Close the open blockers of <strong>{c.case.employee}</strong>.</p>
                <Actions data={{ ...c, asOf: '' }} role="LINE_MANAGER" only="RESOLVE_BLOCKER" onSaved={onSaved} />
              </Modal>
            )}
          </div>
        );
      })}
      {!blocked.length && <p className="muted">Nothing is blocking anyone.</p>}
    </section>
  );
}
