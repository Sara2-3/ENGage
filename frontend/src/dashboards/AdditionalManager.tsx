// Additional Manager (senior developer): helps with the project's technical work, follows that
// onboarding is done properly in every aspect, and reports to the Line Manager.
import { actionsFor, List, Metrics, missing, phase, Table, Title, type Case } from '../shared';

export default function AdditionalManager({ cases, onOpen }: { cases: Case[]; onOpen: (id: string) => void }) {
  const mine = (c: Case) => actionsFor(c, 'Additional Manager').map((a) => a.title);
  return (
    <>
      <Title title="Additional Manager (Senior Developer)"
        need="Help with the technical work, check that onboarding is done properly, and report to the Line Manager." />
      <Metrics items={[
        { title: 'People', value: cases.length },
        { title: 'Need your action', value: cases.filter((c) => mine(c).length).length, tone: 'red' },
        { title: 'Not yet reported', value: cases.filter((c) => !c.reports.some((r) => r.role === 'ADDITIONAL_MANAGER')).length, tone: 'amber' },
      ]} />
      <Table title="Onboarding follow-up" head={['Project', 'Phase', 'Checklist', 'Open issues', 'Your actions']} onOpen={onOpen}
        cases={cases}
        cells={(c) => [
          c.case.project ?? missing,
          phase(c),
          `${c.assessment.checklist.filter((x) => x.state === 'CONFIRMED').length} of ${c.assessment.checklist.length}`,
          <List items={c.assessment.flags.map((f) => f.message)} />,
          <List items={mine(c)} />,
        ]} />
    </>
  );
}
