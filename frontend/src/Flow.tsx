// The levels in order of seniority; reports travel from right to left. HR supports on the side.
const steps = [
  [['PMO', 'PMO']],
  [['MANAGEMENT', 'Management']],
  [['ADDITIONAL_MANAGER', 'Additional Manager']],
  [['LINE_MANAGER', 'Line Manager']],
  [['TECH_LEAD', 'Technical Lead']],
  [['EMPLOYEE', 'Employee']],
  [['HR', 'HR (support)']],
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
