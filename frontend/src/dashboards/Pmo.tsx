// PMO: the widest view, without detail. Completed or still in progress, and in which phase.
import { useState } from 'react';
import CvLink from '../CvLink';
import { allPhases, completed, movement, Person, phase, Title, type Case } from '../shared';

export default function Pmo({ cases }: { cases: Case[] }) {
  const [step, setStep] = useState('');
  const rows = cases.filter((c) => !step || phase(c) === step);
  const done = cases.filter(completed).length;

  return (
    <div className="narrow">
      <Title title="PMO overview" need={`${done} completed · ${cases.length - done} in progress`} />
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
              <Person name={c.case.employee} />
              <small>{movement(c)} · {phase(c)}</small>
            </div>
            <CvLink c={c} role="PMO" />
            <span className={`pill ${completed(c) ? 'GREEN' : 'GREY'}`}>{completed(c) ? 'Completed' : 'In progress'}</span>
          </div>
        ))}
        {!rows.length && <p className="muted">Nobody is in this phase.</p>}
      </section>
    </div>
  );
}
