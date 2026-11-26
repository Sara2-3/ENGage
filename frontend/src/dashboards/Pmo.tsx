// PMO: the highest view. An overview, plus the work of Management, the Additional Manager and
// the Line Manager. Technical work (the Technical Lead's) is not shown. PMO only reads.
import { useState } from 'react';
import type { StaffingRequest } from '../api';
import CvLink from '../CvLink';
import Requests from '../Requests';
import { allPhases, completed, date, movement, Person, phase, Title, type Case } from '../shared';

const tabs = [
  ['OVERVIEW', 'Overview'], ['MANAGEMENT', 'Management'],
  ['ADDITIONAL_MANAGER', 'Additional Manager'], ['LINE_MANAGER', 'Line Manager'],
];

// What one level has recorded in the application, newest first.
function Work({ cases, role }: { cases: Case[]; role: string }) {
  const records = cases
    .flatMap((c) => c.evidence
      .filter((e) => e.id.startsWith('APP-') && e.authorRole === role && e.title !== 'PROFILE' && e.title !== 'CONFIRM_START')
      .map((e) => ({ c, e })))
    .sort((a, b) => Number(b.e.id.slice(4)) - Number(a.e.id.slice(4)));

  return (
    <section className="card">
      <h3>Work recorded ({records.length})</h3>
      {records.map(({ c, e }) => (
        <div className="item" key={e.id}>
          <div className="grow">
            <Person name={c.case.employee} />
            <small>{e.text} · {date(e.date)}</small>
          </div>
        </div>
      ))}
      {!records.length && <p className="muted">Nothing recorded yet.</p>}
    </section>
  );
}

export default function Pmo({ cases, staffing, onOpen }: { cases: Case[]; staffing: StaffingRequest[]; onOpen: (id: string) => void }) {
  const [tab, setTab] = useState('OVERVIEW');
  const [step, setStep] = useState('');
  const rows = cases.filter((c) => !step || phase(c) === step);
  const done = cases.filter(completed).length;

  return (
    <div className="narrow">
      <Title title="PMO overview" need={`${done} completed · ${cases.length - done} in progress`} />
      <div className="tabs" role="group" aria-label="Level">
        {tabs.map(([key, title]) => <button key={key} aria-pressed={tab === key} onClick={() => setTab(key)}>{title}</button>)}
      </div>

      {tab !== 'OVERVIEW' && (
        <>
          {tab === 'ADDITIONAL_MANAGER' && <Requests cases={cases} staffing={staffing} />}
          <Work cases={cases} role={tab} />
        </>
      )}

      {tab === 'OVERVIEW' && (
        <>
          <Requests cases={cases} staffing={staffing} />
          <section className="panel">
            <h3 className="panel-title">Phase</h3>
            <div className="pipeline" role="group" aria-label="Filter by phase">
              {allPhases.map((p) => (
                <button key={p} aria-pressed={step === p} onClick={() => setStep(step === p ? '' : p)}>
                  <strong>{cases.filter((c) => phase(c) === p).length}</strong>{p}
                </button>
              ))}
            </div>
          </section>
          <section className="card">
            {rows.map((c) => (
              <div className="item" key={c.case.id}>
                <div className="grow">
                  <Person name={c.case.employee} onOpen={() => onOpen(c.case.id)} />
                  <small>{movement(c)} · {c.case.project ?? 'No project'} · {phase(c)}</small>
                  {c.assessment.flags[0] && <small className="problem">{c.assessment.flags[0].message}</small>}
                </div>
                <CvLink c={c} role="PMO" />
                <span className={`pill ${completed(c) ? 'GREEN' : 'GREY'}`}>{completed(c) ? 'Completed' : 'In progress'}</span>
              </div>
            ))}
            {!rows.length && <p className="muted">Nobody is in this phase.</p>}
          </section>
        </>
      )}
    </div>
  );
}
