// PMO: the widest view of the system. Completed or still in progress, and in which phase.
import { useState } from 'react';
import { completed, Metrics, missing, movement, phase, type Case } from '../shared';

const tabs = [
  { key: 'ALL', title: 'All' },
  { key: 'NEW_HIRE', title: 'New hires' },
  { key: 'REALLOCATION', title: 'Reallocations' },
];

export default function Pmo({ cases }: { cases: Case[] }) {
  const [tab, setTab] = useState('ALL');
  const inTab = (key: string) => cases.filter((c) => key === 'ALL' || c.case.movement === key);
  const phases = [...new Set(cases.map(phase))];

  return (
    <>
      <h1 className="page-title">PMO</h1>
      <p className="muted">The whole system at a glance: who has completed onboarding, who is in progress, and in which phase.</p>
      <Metrics items={[
        { title: 'Total', value: cases.length },
        { title: 'Completed', value: cases.filter(completed).length, tone: 'green' },
        { title: 'In progress', value: cases.filter((c) => !completed(c)).length },
        { title: 'Need attention', value: cases.filter((c) => c.assessment.colour === 'RED').length, tone: 'red' },
      ]} />
      <Metrics items={phases.map((p) => ({ title: `Phase: ${p}`, value: cases.filter((c) => phase(c) === p).length }))} />

      <section className="panel">
        <div className="toolbar">
          <div className="tabs" role="group" aria-label="Movement">
            {tabs.map((t) => (
              <button key={t.key} aria-pressed={tab === t.key} onClick={() => setTab(t.key)}>{t.title} ({inTab(t.key).length})</button>
            ))}
          </div>
        </div>
        <div className="table">
          <table className="static">
            <thead>
              <tr><th>Case</th><th>Employee</th><th>Movement</th><th>Project</th><th>Onboarding</th><th>Phase</th><th>Attention</th></tr>
            </thead>
            <tbody>
              {inTab(tab).map((c) => (
                <tr key={c.case.id}>
                  <td className="id">{c.case.id}</td>
                  <td>{c.case.employee}</td>
                  <td>{movement(c)}</td>
                  <td>{c.case.project ?? missing}</td>
                  <td>{completed(c) ? 'Completed' : 'In progress'}</td>
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
        </div>
      </section>
    </>
  );
}
