const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
// Same date format as the starter pack table.
export const date = (iso, withYear = true) => {
  const [y, m, d] = iso.split('-');
  return `${d}-${months[Number(m) - 1]}${withYear ? `-${y.slice(2)}` : ''}`;
};

export const movement = (c) => (c.case.movement === 'NEW_HIRE' ? 'New Hire' : 'Reallocation');

export const Title = ({ title, need }) => {
  return (
    <header className="page-head">
      <div>
        <h1 className="page-title">{title}</h1>
        <p className="muted">{need}</p>
      </div>
      <span className="date-chip">Data as of 14 Oct 2026</span>
    </header>
  );
};

const initials = (name) => name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();

export const Person = ({ name, onOpen }) => {
  return (
    <span className="person">
      <span className="avatar" aria-hidden="true">{initials(name)}</span>
      {onOpen ? <button className="link" onClick={onOpen}>{name}</button> : name}
    </span>
  );
};

// Where the onboarding currently stands, without detail.
const phases = ['Assignment', 'Start', 'Learning plan', 'Activities', 'Technical validation'];
export const allPhases = [...phases, 'Final checks', 'Completed'];
export const completed = (c) => c.assessment.decision === 'CAN_CLOSE';
export const phase = (c) => {
  if (completed(c)) return 'Completed';
  const next = c.stages.findIndex((s) => !s.done);
  return next < 0 ? 'Final checks' : phases[next];
};

// Where the Additional Manager's request to HR stands. Records are in order, so a description
// written after the last request answers it.
export const requestState = (c) => {
  if (!c.details.requirement) return null;
  const last = (type) => c.evidence.map((e) => e.title).lastIndexOf(type);
  return last('PROFILE') > last('REQUIREMENT') ? 'ANSWERED' : 'WAITING';
};
