// Central index of reusable knowledge. Documents stay in their project folder; only the folder
// reference is listed here (starter pack, Email 8).
import { Table } from '../Table';

const folderOf = (c) => c.details.docsLocation ?? c.evidence.map((e) => e.text.match(/\/Team\/[\w/]+/)?.[0]).find(Boolean);

const Knowledge = ({ cases }) => {
  const projects = [...new Set(cases.flatMap((c) => (c.case.project ? [c.case.project] : [])))].sort();

  return (
    <Table id="knowledge" title="Reusable knowledge: project folders" empty="No projects yet."
      head={['Project', 'Folder', 'People on the project']}
      rows={projects.map((p) => {
        const team = cases.filter((c) => c.case.project === p);
        const folders = [...new Set(team.map(folderOf).filter(Boolean))];
        return (
          <tr key={p}>
            <td><strong>{p}</strong></td>
            <td>{folders.length ? folders.join(', ') : <span className="warn">Not recorded</span>}</td>
            <td>{team.map((c) => c.case.employee).join(', ')}</td>
          </tr>
        );
      })} />
  );
};

export default Knowledge;
