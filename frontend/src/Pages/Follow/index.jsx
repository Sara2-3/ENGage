// Additional Manager and Technical Lead: both follow that onboarding is done properly
// (technically and in every other aspect) and both report to the Line Manager.
// The list is on the left; the summary of the chosen employee is on the right.
import { useState } from 'react';
import Actions from '../../components/Actions';
import AskHr from '../../components/AskHr';
import WaitingProject from '../../components/WaitingProject';
import CvLink from '../../components/CvLink';
import Modal from '../../components/Modal';
import { Inbox, ReportButton } from '../../components/Reports';
import Review from '../../components/Review';
import { date, movement, Person, phase, Title } from '../../Helper/shared';
import { words } from '../../Helper/format';
import { useCaseContext } from '../../Context/CaseContext';
import { useStaffingContext } from '../../Context/StaffingContext';

const views = {
  ADDITIONAL_MANAGER: { title: 'Additional Manager', need: 'Read the Line Manager reports, follow onboarding, then report to Management.' },
  TECH_LEAD: { title: 'Technical Lead', need: 'Give technical tasks, validate readiness, then report to the Line Manager.' },
};

const tones = { RED: 'Needs attention', AMBER: 'Check', GREY: 'In progress', GREEN: 'On track' };

const done = (c) => c.stages.filter((s) => s.done).length;
const percent = (c) => Math.round((done(c) / c.stages.length) * 100);
// One long "Complete: a; b; c" action becomes a count in the list and separate lines in the summary.
const items = (title) => (title.startsWith('Complete: ') ? title.slice(10).split('; ') : [title]);
const short = (title) => (title.startsWith('Complete: ') ? `Complete ${items(title).length} checklist items` : title);

const Follow = ({ page, role, onOpen, onSaved }) => {
  const { cases } = useCaseContext();
  const { staffing } = useStaffingContext();
  const view = views[role];
  const [chosen, setChosen] = useState('');
  const mine = (c) => c.assessment.actions.filter((a) => a.ownerRole === view.title).map((a) => a.title);
  const todo = cases.filter((c) => mine(c).length);
  const others = cases.filter((c) => !mine(c).length);
  const list = page === 'others' ? others : todo;
  const c = list.find((x) => x.case.id === chosen) ?? list[0];

  const row = (x) => (
    <button key={x.case.id} type="button" className={`follow-row ${x.assessment.colour}`}
      aria-pressed={c?.case.id === x.case.id} onClick={() => setChosen(x.case.id)}>
      <Person name={x.case.employee} />
      <span className="follow-text">{mine(x).map(short).join(' · ') || phase(x)}</span>
      <span className="bar" role="img" aria-label={`${percent(x)}% done`}><i style={{ width: `${percent(x)}%` }} /></span>
    </button>
  );

  const stat = (label, value) => <div className="stat"><strong>{value}</strong>{label}</div>;

  return (
    <div className="wide">
      <Title title={view.title} need={view.need} />
      {page === 'requests' && (
        <div className="add">
          <Modal title="Ask HR for people">
            <AskHr role={role} onSaved={onSaved}
              projects={[...new Set(cases.flatMap((x) => (x.case.project ? [x.case.project] : [])))].sort()} />
          </Modal>
        </div>
      )}
      {page === 'requests' && (
        <section className="card">
          <h3>Requests to HR ({staffing.length})</h3>
          {staffing.map((s) => (
            <div className="item" key={s.id}>
              <div className="grow"><strong>{s.need}</strong><small>{s.project}</small></div>
              <span className={`pill ${s.specs?.assigned ? 'GREEN' : 'AMBER'}`}>{!s.caseId ? 'Waiting for HR' : s.specs?.assigned ? 'Assigned' : 'Found by HR'}</span>
            </div>
          ))}
          {!staffing.length && <p className="muted">No people requested yet.</p>}
        </section>
      )}
      {page === 'reports' && <Inbox cases={cases} from="LINE_MANAGER" title="Reports from Line Manager" />}
      {page === 'waiting' && <WaitingProject cases={cases} staffing={staffing} onOpen={onOpen} onSaved={onSaved} />}
      {(page === 'todo' || page === 'others') && <div className="follow">
        <div>
          <section className="card">
            <h3>{page === 'others' ? 'Other employees' : 'Needs your action'} ({list.length})</h3>
            {list.map(row)}
            {!list.length && <p className="muted">{page === 'others' ? 'No other employees.' : 'Nothing is waiting for you.'}</p>}
          </section>
        </div>

        {c && (
          <aside className="summary" aria-label={`Summary of ${c.case.employee}`} key={c.case.id}>
            <div className="summary-head">
              <Person name={c.case.employee} />
              <p>{c.case.direction ?? movement(c)} · {c.case.project ?? 'No project'} · started {date(c.case.startDate)}</p>
              <span className={`pill ${c.assessment.colour}`}>{tones[c.assessment.colour]}</span>
            </div>

            <div className="summary-body">
              <div className="ring" style={{ background: `conic-gradient(var(--brand) ${percent(c)}%, var(--line) 0)` }}>
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
                {role === 'TECH_LEAD' && (
                  <Modal title="Validate readiness">
                    <p>Readiness of <strong>{c.case.employee}</strong>, based on the work you observed.</p>
                    {c.activities.length
                      ? (
                        <ul>
                          {c.activities.map((a) => {
                            // the newest record of this activity says who set the level
                            const by = c.evidence.find((e) => e.id === a.evidenceIds?.at(-1))?.authorRole;
                            return (
                              <li key={a.name}>
                                {a.name}: <strong>{words(a.level)}</strong>
                                {by && ` · recorded by ${words(by)}`}{!a.validatedByTechOwner && ' · not validated'}
                              </li>
                            );
                          })}
                        </ul>
                      )
                      : <p className="muted">No activities recorded yet.</p>}
                    <Actions data={{ ...c, asOf: '' }} role={role} only="VALIDATE" onSaved={onSaved} />
                  </Modal>
                )}
                <ReportButton c={c} role={role} onSaved={onSaved} />
                {c.reports.some((r) => r.role === role) && <span className="pill GREEN">Reported</span>}
              </div>
            </div>
          </aside>
        )}
      </div>}
    </div>
  );
};

export default Follow;
