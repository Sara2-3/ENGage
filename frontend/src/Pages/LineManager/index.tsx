// Line Manager (starter pack section 2): follow local progress and help remove practical blockers.
// Also reads the Technical Lead's reports and reports to the Additional Manager.
import Blockers from '../Blockers';
import CvLink from '../CvLink';
import { Inbox, latest, ReportButton } from '../Reports';
import Review from '../Review';
import { Person, phase, Title, type Case } from '../shared';

export default function LineManager({ page, cases, onSaved }: { page: string; cases: Case[]; onSaved: () => void }) {
  return (
    <div className="narrow">
      <Title title="Line Manager" need="Follow local progress and help remove practical blockers." />
      {page === 'blockers' && <Blockers cases={cases} onSaved={onSaved} />}
      {page === 'reports' && <Inbox cases={cases} from="TECH_LEAD" title="Reports from Technical Lead" />}
      {page === 'progress' && <section className="card">
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
      </section>}
    </div>
  );
}
