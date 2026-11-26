// Line Manager: reads the Technical Lead's reports and reports to the Additional Manager,
// without technical detail.
import CvLink from '../CvLink';
import { Inbox, latest, ReportButton } from '../Reports';
import Review from '../Review';
import { Person, phase, Title, type Case } from '../shared';

export default function LineManager({ cases, onSaved }: { cases: Case[]; onSaved: () => void }) {
  return (
    <div className="narrow">
      <Title title="Line Manager" need="Read the Technical Lead's reports, then report to the Additional Manager." />
      <Inbox cases={cases} from="TECH_LEAD" title="Reports from Technical Lead" />
      <section className="card">
        <h3>Progress</h3>
        {cases.map((c) => {
          const done = c.stages.filter((s) => s.done).length;
          return (
            <div className="item" key={c.case.id}>
              <div className="grow">
                <Person name={c.case.employee} />
                <small>{phase(c)}{latest(c, 'LINE_MANAGER') && ' · reported'}</small>
              </div>
              <progress max={c.stages.length} value={done} aria-label={`${done} of ${c.stages.length} steps done`} />
              <CvLink c={c} role="LINE_MANAGER" />
              <Review c={c} role="LINE_MANAGER" onSaved={onSaved} />
              <ReportButton c={c} role="LINE_MANAGER" onSaved={onSaved} />
            </div>
          );
        })}
      </section>
    </div>
  );
}
