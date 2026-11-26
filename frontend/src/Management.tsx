// Projects and the people in each, and who has passed onboarding.
import type { Row } from './api';

export default function Management({ rows, onOpen }: { rows: Row[]; onOpen: (id: string) => void }) {
  const ready = rows.filter((r) => r.decision === 'CAN_CLOSE');
  const projects = [...new Set(rows.flatMap((r) => (r.project ? [r.project] : [])))].sort();
  const person = (r: Row) => (
    <button key={r.id} className="row" onClick={() => onOpen(r.id)}>
      <span>{r.employee}</span>
      <span className={`pill ${r.colour}`}>{r.label}</span>
    </button>
  );

  return (
    <>
      <div className="card">
        <h3>Passed onboarding</h3>
        {ready.length ? ready.map(person) : <p className="muted">Nobody yet. A case passes only with technical validation and a complete checklist.</p>}
      </div>

      <h3>Projects</h3>
      <div className="projects">
        {projects.map((name) => (
          <div className="card" key={name}>
            <h3>{name}</h3>
            {rows.filter((r) => r.project === name).map(person)}
          </div>
        ))}
      </div>
    </>
  );
}
