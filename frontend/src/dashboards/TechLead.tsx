// Technical Manager / TL: define KT activities and validate readiness using evidence.
import { words } from '../api';
import { actionsFor, List, Metrics, missing, Table, Title, type Case } from '../shared';

const validation = (c: Case) => {
  if (c.activities.length && c.activities.every((a) => a.validatedByTechOwner)) return { text: 'Validated', tone: 'GREEN' };
  if (c.activities.some((a) => a.validatedByTechOwner)) return { text: 'Partly covered', tone: 'AMBER' };
  return c.activities.length ? { text: 'Not validated', tone: 'AMBER' } : { text: 'No evidence', tone: 'GREY' };
};

export default function TechLead({ cases, onOpen }: { cases: Case[]; onOpen: (id: string) => void }) {
  const withActivities = cases.filter((c) => c.activities.length);
  return (
    <>
      <Title title="Technical Manager / TL" need="Define KT activities and validate technical readiness using evidence." />
      <Metrics items={[
        { title: 'With KT activities', value: withActivities.length },
        { title: 'Without a KT plan', value: cases.length - withActivities.length, tone: 'amber' },
        { title: 'Waiting for you', value: cases.filter((c) => actionsFor(c, 'Technical Lead').length).length, tone: 'red' },
      ]} />
      <Table title="Readiness evidence" head={['Project', 'KT activities', 'Validation', 'Your actions']} onOpen={onOpen}
        cases={withActivities}
        cells={(c) => [
          c.case.project ?? missing,
          <List items={c.activities.map((a) => `${a.name}: ${words(a.level)}`)} />,
          <span className={`pill ${validation(c).tone}`}>{validation(c).text}</span>,
          <List items={actionsFor(c, 'Technical Lead').map((a) => a.title)} />,
        ]} />
      <Table title="No KT activities recorded yet" head={['Project', 'Tracker status']} onOpen={onOpen}
        cases={cases.filter((c) => !c.activities.length)}
        cells={(c) => [c.case.project ?? missing, c.case.trackerStatus]} />
    </>
  );
}
