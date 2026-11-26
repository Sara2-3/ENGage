// Additional Manager and Technical Lead: both follow that onboarding is done properly
// (technically and in every other aspect) and both report to the Line Manager.
// The list is on the left; the summary of the chosen employee is on the right.
import { useState } from 'react';
import Actions from '../Actions';
import AskHr from '../AskHr';
import CvLink from '../CvLink';
import Modal from '../Modal';
import { Inbox, ReportButton } from '../Reports';
import Review from '../Review';
import { date, movement, Person, phase, Title, type Case } from '../shared';

const views = {
  ADDITIONAL_MANAGER: { title: 'Additional Manager', need: 'Read the Line Manager reports, follow onboarding, then report to Management.' },
  TECH_LEAD: { title: 'Technical Lead', need: 'Give technical tasks, validate readiness, then report to the Line Manager.' },
};

const tones: Record<string, string> = { RED: 'Needs attention', AMBER: 'Check', GREY: 'In progress', GREEN: 'On track' };

const done = (c: Case) => c.stages.filter((s) => s.done).length;
const percent = (c: Case) => Math.round((done(c) / c.stages.length) * 100);
// One long "Complete: a; b; c" action becomes a count in the list and separate lines in the summary.
const items = (title: string) => (title.startsWith('Complete: ') ? title.slice(10).split('; ') : [title]);
const short = (title: string) => (title.startsWith('Complete: ') ? `Complete ${items(title).length} checklist items` : title);

export default function Follow({ role, cases, onOpen, onSaved }: {
  role: keyof typeof views; cases: Case[]; onOpen: (id: string) => void; onSaved: () => void;
}) {
  const view = views[role];
  const [chosen, setChosen] = useState('');
  const mine = (c: Case) => c.assessment.actions.filter((a) => a.ownerRole === view.title).map((a) => a.title);
  const todo = cases.filter((c) => mine(c).length);
  const others = cases.filter((c) => !mine(c).length);
  const c = cases.find((x) => x.case.id === chosen) ?? todo[0] ?? cases[0];

  const row = (x: Case) => (
    <button key={x.case.id} type="button" className={`follow-row ${x.assessment.colour}`}
      aria-pressed={c?.case.id === x.case.id} onClick={() => setChosen(x.case.id)}>
      <Person name={x.case.employee} />
      <span className="follow-text">{mine(x).map(short).join(' · ') || phase(x)}</span>
      <span className="bar" role="img" aria-label={`${percent(x)}% done`}><i style={{ width: `${percent(x)}%` }} /></span>
    </button>
  );

  const stat = (label: string, value: string) => <div className="stat"><strong>{value}</strong>{label}</div>;

  return (
    <div className="wide">
      <Title title={view.title} need={view.need} />
      {role === 'ADDITIONAL_MANAGER' && (
        <div className="add">
          <Modal title="Ask HR for people">
            <AskHr role={role} onSaved={onSaved}
              projects={[...new Set(cases.flatMap((x) => (x.case.project ? [x.case.project] : [])))].sort()} />
          </Modal>
        </div>
      )}
      {role === 'ADDITIONAL_MANAGER' && <Inbox cases={cases} from="LINE_MANAGER" title="Reports from Line Manager" />}
      <div className="follow">
        <div>
          <section className="card">
            <h3>Needs your action ({todo.length})</h3>
            {todo.map(row)}
            {!todo.length && <p className="muted">Nothing is waiting for you.</p>}
          </section>
          <details className="card">
            <summary>Other employees ({others.length})</summary>
            {others.map(row)}
          </details>
        </div>

        {c && (
          <aside className="summary" aria-label={`Summary of ${c.case.employee}`} key={c.case.id}>
            <div className="summary-head">
              <Person name={c.case.employee} />
              <p>{c.case.direction ?? movement(c)} · {c.case.project ?? 'No project'} · started {date(c.case.startDate)}</p>
              <span className={`pill ${c.assessment.colour}`}>{tones[c.assessment.colour]}</span>
            </div>

            <div className="summary-body">
              <div className="ring" style={{ background: `conic-gradient(var(--brand) ${percent(c)}%, #ece9ef 0)` }}>
                <span><strong>{percent(c)}%</strong>{phase(c)}</span>
              </div>

              <div className="stats">
                {stat('Steps', `${done(c)}/${c.stages.length}`)}
                {stat('Access works', c.access.length ? `${c.access.filter((a) => a.state === 'USABLE').length}/${c.access.length}` : '-')}
                {stat('Validated', c.activities.length ? `${c.activities.filter((a) => a.validatedByTechOwner).length}/${c.activities.length}` : '-')}
              </div>

              {c.details.description && <p>{c.details.description}</p>}

              {role === 'TECH_LEAD' && (
                <>
                  <h4>Technical tasks</h4>
                  {c.tasks?.length
                    ? <ul>{c.tasks.map((t) => <li key={t.id}>{t.title} ({t.done ? 'done' : 'open'})</li>)}</ul>
                    : <p className="muted">No tasks yet.</p>}
                </>
              )}

              <h4>To do</h4>
              {mine(c).length
                ? <ul>{mine(c).flatMap(items).map((t) => <li key={t}>{t}</li>)}</ul>
                : <p className="muted">Nothing for you.</p>}

              {c.assessment.flags.length > 0 && (
                <>
                  <h4>Problems</h4>
                  <ul>{c.assessment.flags.map((f) => <li key={f.code}>{f.message}</li>)}</ul>
                </>
              )}

              <div className="summary-actions">
                <CvLink c={c} role={role} />
                <button type="button" onClick={() => onOpen(c.case.id)}>Open case</button>
                {role === 'ADDITIONAL_MANAGER' && (
                  <Modal title="Request to HR">
                    <p>Request about <strong>{c.case.employee}</strong>. HR answers it in the description; PMO can see it.</p>
                    {c.details.requirement && <blockquote>{c.details.requirement}</blockquote>}
                    <Actions data={{ ...c, asOf: '' }} role={role} only="REQUIREMENT" onSaved={onSaved} />
                  </Modal>
                )}
                <Review c={c} role={role} onSaved={onSaved} />
                {role === 'TECH_LEAD' && (
                  <Modal title="Assign task">
                    <p>Technical task for <strong>{c.case.employee}</strong> on {c.case.project ?? 'no project yet'}.</p>
                    <Actions data={{ ...c, asOf: '' }} role={role} only="TASK" onSaved={onSaved} />
                  </Modal>
                )}
                <ReportButton c={c} role={role} onSaved={onSaved} />
                {c.reports.some((r) => r.role === role) && <span className="pill GREEN">Reported</span>}
              </div>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
