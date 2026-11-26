import { useEffect, useState } from 'react';
import Actions from './Actions';
import EvidenceReview from './EvidenceReview';
import CvLink from './CvLink';
import Modal from './Modal';
import Review from './Review';
import { api, roles, words, type Detail } from './api';

const decisionText: Record<string, string> = {
  CANNOT_CLOSE: 'Cannot close yet',
  NEEDS_INFORMATION: 'Needs information',
  CAN_CLOSE: 'Can be closed',
};
interface Advice { source: string; draft: { to: string; subject: string; body: string } }

export default function CaseView({ id, viewer, onChanged }: { id: string; viewer: string; onChanged: () => void }) {
  const [role, setRole] = useState(viewer);
  const [data, setData] = useState<Detail | null>(null);
  const [advice, setAdvice] = useState<Advice | null>(null);
  const [message, setMessage] = useState('');
  const [note, setNote] = useState('');

  useEffect(() => {
    api<Detail>(`/cases/${id}`).then(setData).catch(() => setNote('Could not load this case.'));
  }, [id]);

  if (!data) return <article className="card">{note || 'Loading…'}</article>;
  const { case: c, assessment: a } = data;
  const hidden = (role: string) => viewer === 'PMO' && role === 'TECH_LEAD';
  const evidence = data.evidence.filter((e) => !(e.id.startsWith('APP-') && hidden(e.authorRole)));
  const reports = data.reports.filter((r) => !hidden(r.role));
  const feedback = (data.feedback ?? []).filter((r) => !hidden(r.role));

  const prepare = async () => {
    try {
      const result = await api<Advice>(`/cases/${id}/advice`, {});
      setAdvice(result);
      setMessage(result.draft.body);
      setNote('');
    } catch { setNote('Could not prepare the message.'); }
  };
  const review = async (decision: 'approved' | 'rejected') => {
    try {
      await api(`/cases/${id}/reviews`, { decision, message });
      setAdvice(null);
      setNote(decision === 'approved' ? 'Approved. Sending is simulated.' : 'Draft rejected.');
    } catch { setNote('Could not save the review. The message cannot be empty.'); }
  };
  const saved = (updated: Detail) => {
    setData(updated);
    setAdvice(null);
    onChanged();
  };

  return (
    <article>
      <div className="card">
        <div className="case-head">
          <div>
            <h2>{c.employee}</h2>
            <p className="muted">
              {c.id} · {words(c.movement)}{c.direction && ` · ${c.direction}`} · {c.project ?? 'No project'} · started {c.startDate} · manager {c.manager ?? 'unknown'}
            </p>
            <p className="muted">Tracker says “{c.trackerStatus}” (updated {c.lastUpdate})</p>
          </div>
          <span className={`pill ${a.colour}`}>{decisionText[a.decision]}</span>
        </div>
        <ol className="stages">
          {data.stages.map((s) => (
            <li key={s.title} className={s.done ? 'done' : ''}>{s.done ? '✓' : '○'} {s.title}</li>
          ))}
        </ol>
      </div>

      {viewer !== 'EMPLOYEE' && (
        <p className="case-links">
          <CvLink c={data} role={viewer} />
          <Review c={data} role={viewer} onSaved={() => { api<Detail>(`/cases/${id}`).then(setData).catch(() => {}); onChanged(); }} />
        </p>
      )}

      <div className="modules">
        <Modal title="What is wrong" summary={a.flags.length ? `${a.flags.length} issue${a.flags.length > 1 ? 's' : ''}` : 'No issue detected'}>
          {a.flags.length
            ? <ul>{a.flags.map((f) => <li key={f.code}>{f.message}</li>)}</ul>
            : <p>{a.decision === 'CAN_CLOSE' ? 'No open issues.' : 'No issue detected, but readiness is not confirmed yet.'}</p>}
        </Modal>

        <Modal title="Next steps" summary={a.actions[0]?.title ?? 'Nothing to do'}>
          <ol>{a.actions.map((x) => <li key={x.title}>{x.title} <span className="muted">({x.ownerRole})</span></li>)}</ol>
          <button className="primary" onClick={prepare}>Prepare message</button>
          {advice && (
            <div>
              <p className="muted">{advice.source} · To: {advice.draft.to} · {advice.draft.subject}</p>
              <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={10} aria-label="Message draft" />
              <button className="primary" onClick={() => review('approved')}>Approve</button>{' '}
              <button onClick={() => review('rejected')}>Reject</button>
            </div>
          )}
          {note && <p role="status">{note}</p>}
        </Modal>

        <Modal title="Evidence" summary={evidence.length ? `${evidence.length} record${evidence.length > 1 ? 's' : ''}` : 'None recorded'}>
          {evidence.length === 0 && <p className="muted">No evidence recorded. Only the tracker row is available.</p>}
          {evidence.map((e) => (
            <blockquote key={e.id}>
              {e.text}
              <small>{e.id} · {words(e.authorRole)} · {e.date}</small>
            </blockquote>
          ))}
        </Modal>

        {id === 'ONB-005' && (
          <Modal title="Evidence analysis" summary="Simulated analysis and technical review">
            <EvidenceReview caseId={id} />
          </Modal>
        )}

        {viewer !== 'PMO' && (
        <Modal title="Record an update" summary="Add progress, access or a blocker">
          <label className="role">
            Acting as (demo, no login)
            <select value={role} onChange={(e) => setRole(e.target.value)}>
              {roles.map((r) => <option key={r.key} value={r.key}>{r.title}</option>)}
            </select>
          </label>
          <Actions key={role} data={data} role={role} onSaved={saved} />
        </Modal>
        )}

        {viewer !== 'EMPLOYEE' && (
          <Modal title="Reports and reviews" summary={`${reports.length} reports · ${feedback.length} reviews`}>
            <h3>Reports</h3>
            {reports.map((r, i) => (
              <blockquote key={i}>{words(r.status)}: {r.note}<small>{words(r.role)} · {r.date}</small></blockquote>
            ))}
            {!reports.length && <p className="muted">No report yet.</p>}
            <h3>Reviews</h3>
            {feedback.map((r, i) => (
              <blockquote key={i}>{words(r.rating)}: {r.text}<small>{words(r.role)} · {r.date}</small></blockquote>
            ))}
            {!feedback.length && <p className="muted">No review yet.</p>}
          </Modal>
        )}

        <Modal title="Details" summary="Readiness, access, blockers and checklist">
          <h3>Readiness by activity</h3>
          <ul>
          {data.activities.map((x) => (
          <li key={x.name}>{x.name}: {words(x.level)} {x.validatedByTechOwner ? '(technical owner)' : '(not validated)'}</li>
          ))}
          {!data.activities.length && <li>Unknown</li>}
          </ul>
          <h3>Access</h3>
          <ul>
          {data.access.map((x) => (
          <li key={x.system}>{x.system}: {words(x.state)}. {x.note}. Owner: {x.owner ?? 'unassigned'}. Follow-up: {x.nextFollowUp ?? 'not set'}</li>
          ))}
          {!data.access.length && <li>Unknown</li>}
          </ul>
          <h3>Blockers</h3>
          <ul>
          {data.blockers.map((x, i) => <li key={i}>{x.description} · {x.resolved ? 'resolved' : 'open'} · owner {x.owner ?? 'unassigned'}</li>)}
          {!data.blockers.length && <li>None recorded</li>}
          </ul>
          <h3>Onboarding checklist</h3>
          <ul>{a.checklist.map((x) => <li key={x.item}>{x.item}: <strong>{words(x.state)}</strong></li>)}</ul>
        </Modal>
      </div>
    </article>
  );
}
