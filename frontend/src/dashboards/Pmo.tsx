// PMO: the widest view of the system. Completed or still in progress, and in which phase.
import { useState } from 'react';
import { allPhases, completed, Metrics, missing, movement, Person, phase, Title, type Case } from '../shared';

const tabs = [
  { key: 'ALL', title: 'All' },
  { key: 'NEW_HIRE', title: 'New hires' },
  { key: 'REALLOCATION', title: 'Reallocations' },
];

export default function Pmo({ cases }: { cases: Case[] }) {
  const [tab, setTab] = useState('ALL');
  const [step, setStep] = useState('');
  const [query, setQuery] = useState('');
  const inTab = (key: string) => cases.filter((c) => key === 'ALL' || c.case.movement === key);
  const text = query.trim().toLowerCase();
  const rows = inTab(tab).filter((c) =>
    (!step || phase(c) === step)
    && `${c.case.id} ${c.case.employee} ${c.case.project ?? ''}`.toLowerCase().includes(text));

  return (
    <>
      <Title title="PMO overview" need="The whole system at a glance: who has completed onboarding, who is in progress, and in which phase." />
      <Metrics items={[
        { title: 'Total', value: cases.length },
        { title: 'Completed', value: cases.filter(completed).length, tone: 'green' },
        { title: 'In progress', value: cases.filter((c) => !completed(c)).length },
        { title: 'Need attention', value: cases.filter((c) => c.assessment.colour === 'RED').length, tone: 'red' },
      ]} />

      <section className="panel">
        <h3 className="panel-title">Where everyone is now</h3>
        <div className="pipeline" role="group" aria-label="Filter by phase">
          {allPhases.map((p) => (
            <button key={p} aria-pressed={step === p} onClick={() => setStep(step === p ? '' : p)}>
              <strong>{cases.filter((c) => phase(c) === p).length}</strong>{p}
            </button>
          ))}
        </div>
      </section>

      <section className="panel">
        <div className="toolbar">
          <div className="tabs" role="group" aria-label="Movement">
            {tabs.map((t) => (
              <button key={t.key} aria-pressed={tab === t.key} onClick={() => setTab(t.key)}>{t.title} ({inTab(t.key).length})</button>
            ))}
          </div>
          <input className="search" type="search" value={query} onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, project or case" aria-label="Search cases" />
        </div>
        <div className="table">
          <table className="static">
            <thead>
              <tr><th>Employee</th><th>Case</th><th>Movement</th><th>Project</th><th>Onboarding</th><th>Phase</th><th>Attention</th></tr>
            </thead>
            <tbody>
              {rows.map((c) => (
                <tr key={c.case.id}>
                  <td><Person name={c.case.employee} /></td>
                  <td className="id">{c.case.id}</td>
                  <td>{movement(c)}</td>
                  <td>{c.case.project ?? missing}</td>
                  <td><span className={`pill ${completed(c) ? 'GREEN' : 'GREY'}`}>{completed(c) ? 'Completed' : 'In progress'}</span></td>
                  <td>{phase(c)}</td>
                  <td>
                    {c.assessment.colour === 'RED' ? <span className="pill RED">Yes</span>
                      : c.assessment.colour === 'AMBER' ? <span className="pill AMBER">Check</span>
                        : <span className="muted">-</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!rows.length && <p className="empty muted">No cases match this filter.</p>}
        </div>
      </section>
    </>
  );
}
