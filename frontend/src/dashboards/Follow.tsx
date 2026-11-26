// Additional Manager and Technical Lead: both follow that onboarding is done properly
// (technically and in every other aspect) and both report to the Line Manager.
import Actions from '../Actions';
import Modal from '../Modal';
import { Person, phase, Title, type Case } from '../shared';

const views = {
  ADDITIONAL_MANAGER: { title: 'Additional Manager', need: 'Follow that onboarding is done properly, then report to the Line Manager.' },
  TECH_LEAD: { title: 'Technical Lead', need: 'Check the technical work, validate readiness, then report to the Line Manager.' },
};

export default function Follow({ role, cases, onOpen, onSaved }: {
  role: keyof typeof views; cases: Case[]; onOpen: (id: string) => void; onSaved: () => void;
}) {
  const view = views[role];
  const mine = (c: Case) => c.assessment.actions.filter((a) => a.ownerRole === view.title).map((a) => a.title);
  const todo = cases.filter((c) => mine(c).length);
  const others = cases.filter((c) => !mine(c).length);

  const row = (c: Case) => {
    const reported = c.reports.some((r) => r.role === role);
    return (
      <div className="item" key={c.case.id}>
        <div className="grow">
          <Person name={c.case.employee} onOpen={() => onOpen(c.case.id)} />
          <small>{mine(c).join(' · ') || `${c.case.project ?? 'No project'} · ${phase(c)}`}</small>
        </div>
        {reported && <span className="pill GREEN">Reported</span>}
        {role === 'ADDITIONAL_MANAGER' && (
          <Modal title="Requirements">
            <p>Requirements for <strong>{c.case.employee}</strong>. HR uses them to write the description.</p>
            {c.details.requirement && <blockquote>{c.details.requirement}</blockquote>}
            <Actions data={{ ...c, asOf: '' }} role={role} only="REQUIREMENT" onSaved={onSaved} />
          </Modal>
        )}
        <Modal title="Report">
          <p>Report on <strong>{c.case.employee}</strong> to the Line Manager.</p>
          <Actions data={{ ...c, asOf: '' }} role={role} only="REPORT" onSaved={onSaved} />
        </Modal>
      </div>
    );
  };

  return (
    <div className="narrow">
      <Title title={view.title} need={view.need} />
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
  );
}
