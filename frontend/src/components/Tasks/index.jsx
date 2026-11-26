// The employee's projects, with the technical tasks the Technical Lead assigned for each.
import { useState } from 'react';
import { date } from '../../Helper/shared';
import { add_record_service } from '../../Services/CaseService';

const Tasks = ({ c, onSaved }) => {
  const [note, setNote] = useState('');
  const tasks = c.tasks ?? [];
  const projects = [...new Set([...(c.projects ?? []), ...tasks.map((t) => t.project)])];

  const finish = async (taskId) => {
    try {
      await add_record_service(c.case.id, { type: 'TASK_DONE', actorRole: 'EMPLOYEE', payload: { taskId } });
      setNote('Task marked as done.');
      onSaved();
    } catch (error) { setNote(error.message); }
  };

  return (
    <section className="card">
      <h3>My projects and tasks</h3>
      {projects.map((p) => (
        <div key={p}>
          <h4>{p}{p === c.case.project ? ' · current' : ''}</h4>
          {tasks.filter((t) => t.project === p).map((t) => (
            <div className="item" key={t.id}>
              <div className="grow">
                {t.title}
                {t.due && <small>Due {date(t.due)}</small>}
              </div>
              {t.done
                ? <span className="pill GREEN">Done</span>
                : <button onClick={() => finish(t.id)}>Mark as done</button>}
            </div>
          ))}
          {!tasks.some((t) => t.project === p) && <p className="muted">No tasks assigned yet.</p>}
        </div>
      ))}
      {!projects.length && <p className="muted">You are not attached to a project yet.</p>}
      {note && <p role="status">{note}</p>}
    </section>
  );
};

export default Tasks;
