// Reporting goes one level up: Technical Lead → Line Manager → Additional Manager → Management.
// Each level reads the latest reports from the level below and reports to the level above.
import Actions from './Actions';
import { words } from './api';
import Modal from './Modal';
import { date, Person, type Case } from './shared';

export const above: Record<string, string> = {
  TECH_LEAD: 'Line Manager', LINE_MANAGER: 'Additional Manager', ADDITIONAL_MANAGER: 'Management',
};

export const latest = (c: Case, role: string) => [...c.reports].reverse().find((r) => r.role === role);

export function ReportButton({ c, role, onSaved }: { c: Case; role: string; onSaved: () => void }) {
  return (
    <Modal title={`Report to ${above[role]}`}>
      <p>Report on <strong>{c.case.employee}</strong>.</p>
      <Actions data={{ ...c, asOf: '' }} role={role} only="REPORT" onSaved={onSaved} />
    </Modal>
  );
}

export function Inbox({ cases, from, title }: { cases: Case[]; from: string; title: string }) {
  const received = cases
    .flatMap((c) => {
      const report = latest(c, from);
      return report ? [{ c, report }] : [];
    })
    // Reports asking for help come first.
    .sort((a, b) => Number(b.report.status === 'NEEDS_HELP') - Number(a.report.status === 'NEEDS_HELP'));

  return (
    <section className="card">
      <h3>{title} ({received.length})</h3>
      {received.map(({ c, report }) => (
        <div className="item" key={c.case.id}>
          <div className="grow">
            <Person name={c.case.employee} />
            <small>{report.note} · {date(report.date)}</small>
          </div>
          <span className={`pill ${report.status === 'NEEDS_HELP' ? 'RED' : 'GREEN'}`}>{words(report.status)}</span>
        </div>
      ))}
      {!received.length && <p className="muted">No reports yet.</p>}
    </section>
  );
}
