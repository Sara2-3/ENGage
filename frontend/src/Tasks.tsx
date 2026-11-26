// The employee's projects, with the technical tasks the Technical Lead assigned for each.
import { useState } from 'react';
import { api } from './api';
import { date, type Case } from './shared';

export default function Tasks({ c, onSaved }: { c: Case; onSaved: () => void }) {
  const [note, setNote] = useState('');
  const tasks = c.tasks ?? [];
  const projects = [...new Set([...(c.projects ?? []), ...tasks.map((t) => t.project)])];

  const finish = async (taskId: string) => {
    try {
      await api(`/cases/${c.case.id}/events`, { type: 'TASK_DONE', actorRole: 'EMPLOYEE', payload: { taskId } });
      setNote('Task marked as done.');
      onSaved();
    } catch (error) { setNote((error as Error).message); }
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
}
