// Line Manager: general picture of how the process has gone so far, without technical detail.
// The Additional Manager and the Technical Lead report here.
import { words } from '../api';
import { completed, Metrics, missing, phase, type Case } from '../shared';

const latest = (c: Case, role: string) => {
  const r = [...c.reports].reverse().find((x) => x.role === role);
  return r
    ? <><span className={`pill ${r.status === 'NEEDS_HELP' ? 'RED' : 'GREEN'}`}>{words(r.status)}</span><small>{r.note}</small></>
    : <span className="muted">No report yet</span>;
};

export default function LineManager({ cases }: { cases: Case[] }) {
  return (
    <>
      <h1 className="page-title">Line Manager</h1>
      <p className="muted">How onboarding has progressed so far, based on reports from the Additional Manager and Technical Lead.</p>
      <Metrics items={[
        { title: 'People', value: cases.length },
        { title: 'Completed', value: cases.filter(completed).length, tone: 'green' },
        { title: 'In progress', value: cases.filter((c) => !completed(c)).length },
        { title: 'Reports asking for help', value: cases.filter((c) => c.reports.some((r) => r.status === 'NEEDS_HELP')).length, tone: 'red' },
      ]} />
      <section className="panel">
        <h3 className="panel-title">Progress and reports</h3>
        <div className="table">
          <table className="static">
            <thead>
              <tr><th>Employee</th><th>Project</th><th>Phase</th><th>Steps done</th><th>Additional Manager</th><th>Technical Lead</th></tr>
            </thead>
            <tbody>
              {cases.map((c) => (
                <tr key={c.case.id}>
                  <td>{c.case.employee}</td>
                  <td>{c.case.project ?? missing}</td>
                  <td>{phase(c)}</td>
                  <td><progress max={c.stages.length} value={c.stages.filter((s) => s.done).length} /> {c.stages.filter((s) => s.done).length}/{c.stages.length}</td>
                  <td>{latest(c, 'ADDITIONAL_MANAGER')}</td>
                  <td>{latest(c, 'TECH_LEAD')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
