// Line Manager: the general picture of how onboarding has gone, without technical detail.
// The Additional Manager and the Technical Lead report here.
import { words } from '../api';
import CvLink from '../CvLink';
import { Person, phase, Title, type Case } from '../shared';

const latest = (c: Case, role: string) => [...c.reports].reverse().find((r) => r.role === role);
const from = [['ADDITIONAL_MANAGER', 'Additional Manager'], ['TECH_LEAD', 'Technical Lead']];

export default function LineManager({ cases }: { cases: Case[] }) {
  const help = cases.flatMap((c) => from.flatMap(([role, name]) => {
    const r = latest(c, role);
    return r?.status === 'NEEDS_HELP' ? [{ key: c.case.id + role, who: c.case.employee, name, note: r.note }] : [];
  }));

  return (
    <div className="narrow">
      <Title title="Line Manager" need="How onboarding is going, based on reports from the Additional Manager and Technical Lead." />
      {help.length > 0 && (
        <section className="card now">
          <p className="eyebrow">Needs your help</p>
          <ul>{help.map((h) => <li key={h.key}><strong>{h.who}:</strong> {h.note} ({h.name})</li>)}</ul>
        </section>
      )}
      <section className="card">
        <h3>Progress</h3>
        {cases.map((c) => {
          const done = c.stages.filter((s) => s.done).length;
          return (
            <div className="item" key={c.case.id}>
              <div className="grow">
                <Person name={c.case.employee} />
                <small>{phase(c)}</small>
              </div>
              <CvLink c={c} role="LINE_MANAGER" />
              <progress max={c.stages.length} value={done} aria-label={`${done} of ${c.stages.length} steps done`} />
              <span className="reports">
                {from.map(([role, name]) => {
                  const r = latest(c, role);
                  return r && <span key={role} title={`${name}: ${r.note}`} className={`pill ${r.status === 'NEEDS_HELP' ? 'RED' : 'GREEN'}`}>{words(r.status)}</span>;
                })}
                {!c.reports.length && <span className="muted">No report yet</span>}
              </span>
            </div>
          );
        })}
      </section>
    </div>
  );
}
