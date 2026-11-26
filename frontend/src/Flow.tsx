// The onboarding workflow between roles. Additional Manager and Technical Lead work side by side
// and both report to the Line Manager. PMO sees the whole.
const steps = [
  [['MANAGEMENT', 'Management']],
  [['HR', 'HR']],
  [['EMPLOYEE', 'Employee']],
  [['ADDITIONAL_MANAGER', 'Additional Manager'], ['TECH_LEAD', 'Technical Lead']],
  [['LINE_MANAGER', 'Line Manager']],
  [['PMO', 'PMO']],
];

export default function Flow({ role, onPick }: { role: string; onPick: (key: string) => void }) {
  return (
    <ol className="flow" aria-label="Onboarding workflow">
      {steps.map((group) => (
        <li key={group[0][0]}>
          {group.map(([key, title]) => (
            <button key={key} aria-current={role === key ? 'step' : undefined} onClick={() => onPick(key)}>{title}</button>
          ))}
        </li>
      ))}
    </ol>
  );
}
