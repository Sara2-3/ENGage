// The employee's own profile: CV, project assignment, project statuses and reviews received.
import { words } from './api';
import CvLink from './CvLink';
import Tasks from './Tasks';
import { accessState } from './dashboards/Employee';
import { reviewers, tones } from './Review';
import { date, movement, Person, type Case } from './shared';

export default function Profile({ c, onSaved }: { c: Case; onSaved: () => void }) {
  const d = c.details;
  const folder = d.docsLocation ?? c.evidence.map((e) => e.text.match(/\/Team\/[\w/]+/)?.[0]).find(Boolean);
  const validated = c.stages[c.stages.length - 1].done;
  const feedback = [...(c.feedback ?? [])].reverse();

  const fact = (label: string, value?: string | null) => (
    <div className="item" key={label}>
      <span className="muted">{label}</span>
      <strong>{value || <span className="warn">Missing</span>}</strong>
    </div>
  );

  return (
    <>
      <section className="card">
        <div className="item">
          <Person name={c.case.employee} />
          <CvLink c={c} role="EMPLOYEE" />
        </div>
        <p>{d.description ?? <span className="muted">No description yet.</span>}</p>
      </section>

      <Tasks c={c} onSaved={onSaved} />

      <section className="card">
        <h3>My project</h3>
        {fact('Project', c.case.project)}
        {fact('Exact role', d.role)}
        {fact('Movement', movement(c))}
        {c.case.direction && fact('Direction', c.case.direction)}
        {fact('Start date', date(c.case.startDate))}
        {fact('Manager', c.case.manager)}
        {fact('Line Manager', d.lineManager)}
        {fact('Technical Lead', d.techLead)}
        {fact('Additional Manager', d.ktOwner)}
        {fact('Readiness review date', d.reviewDate)}
        {fact('Documents folder', folder)}
      </section>

      <section className="card">
        <h3>Project status</h3>
        <ol className="stages">
          {c.stages.map((s) => <li key={s.title} className={s.done ? 'done' : ''}>{s.done ? '✓' : '○'} {s.title}</li>)}
        </ol>
        {fact('Tracker status', c.case.trackerStatus)}
        <div className="item">
          <span className="muted">Readiness</span>
          <span className={`pill ${validated ? 'GREEN' : 'AMBER'}`}>{validated ? 'Confirmed by Technical Lead' : 'Not confirmed yet'}</span>
        </div>
        {c.access.map((a) => (
          <div className="item" key={a.system}>
            <span>Access: {a.system}</span>
            <span className={`pill ${accessState[a.state].tone}`}>{accessState[a.state].text}</span>
          </div>
        ))}
        {c.activities.map((a) => (
          <div className="item" key={a.name}>
            <span>Learning: {a.name}</span>
            <span className={`pill ${a.level === 'INDEPENDENT' ? 'GREEN' : 'GREY'}`}>{words(a.level)}</span>
          </div>
        ))}
        {c.blockers.filter((b) => !b.resolved).map((b) => (
          <div className="item" key={b.description}>
            <span>Blocker: {b.description}</span>
            <span className="pill RED">Open</span>
          </div>
        ))}
      </section>

      <section className="card">
        <h3>Reviews ({feedback.length})</h3>
        {feedback.map((r, i) => (
          <blockquote key={i}>
            <span className={`pill ${tones[r.rating] ?? 'GREY'}`}>{words(r.rating)}</span>
            <p>{r.text}</p>
            <small>{reviewers[r.role] ?? words(r.role)} · {date(r.date)}</small>
          </blockquote>
        ))}
        {!feedback.length && <p className="muted">No review yet.</p>}
        <p className="muted">A review is an opinion. Final readiness is confirmed only by the Technical Lead.</p>
      </section>
    </>
  );
}
