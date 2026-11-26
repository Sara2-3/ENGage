// Management: knows all company projects and asks HR for people according to project needs.
import { useState } from 'react';
import { api, type StaffingRequest } from '../api';
import Management from '../Management';
import { date, has, List, Metrics, missing, problem, Table, Title, toRow, type Case } from '../shared';

export default function Executive({ cases, staffing, onOpen, onSaved }: {
  cases: Case[]; staffing: StaffingRequest[]; onOpen: (id: string) => void; onSaved: () => void;
}) {
  const [project, setProject] = useState('');
  const [need, setNeed] = useState('');
  const [note, setNote] = useState('');

  const projects = [...new Set([
    ...cases.flatMap((c) => (c.case.project ? [c.case.project] : [])),
    ...staffing.map((s) => s.project),
  ])].sort();
  const urgent = cases.filter((c) => c.assessment.colour === 'RED');
  const noProject = cases.filter((c) => !c.case.project);
  const name = (id: string | null) => cases.find((c) => c.case.id === id)?.case.employee;

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api('/staffing', { actorRole: 'MANAGEMENT', project, need });
      setProject('');
      setNeed('');
      setNote('Request sent to HR.');
      onSaved();
    } catch (error) { setNote((error as Error).message); }
  };

  return (
    <>
      <Title title="Management" need="All company projects, and requests to HR for the people they need." />
      <Metrics items={[
        { title: 'Projects', value: projects.length },
        { title: 'Open requests to HR', value: staffing.filter((s) => s.status === 'OPEN').length, tone: 'amber' },
        { title: 'No project recorded', value: noProject.length, tone: 'amber' },
        { title: 'At risk', value: urgent.length, tone: 'red' },
      ]} />

      <form className="card" onSubmit={send}>
        <h3>Ask HR for people</h3>
        <label>Project
          <input list="all-projects" value={project} onChange={(e) => setProject(e.target.value)} placeholder="Choose or type a project" />
        </label>
        <datalist id="all-projects">{projects.map((p) => <option key={p} value={p} />)}</datalist>
        <label>What the project needs
          <input value={need} onChange={(e) => setNeed(e.target.value)} placeholder="For example: one support analyst" />
        </label>
        <button className="primary" disabled={!project.trim() || !need.trim()}>Send request</button>
        {note && <p role="status">{note}</p>}
        {staffing.length > 0 && <List items={staffing.map((s) =>
          `${s.project}: ${s.need}. ${s.status === 'OPEN' ? 'Waiting for HR' : `Filled with ${name(s.caseId) ?? s.caseId}`}`)} />}
      </form>

      <Table title="Needs intervention" head={['Project', 'Risk']} onOpen={onOpen}
        cases={urgent}
        cells={(c) => [c.case.project ?? missing, problem(c)]} />
      <Table title="No project recorded" head={['Movement', 'Start']} onOpen={onOpen}
        cases={noProject}
        cells={(c) => [c.case.movement === 'NEW_HIRE' ? 'New Hire' : 'Reallocation', date(c.case.startDate)]}
        empty="Everyone has a project." />
      <Table title="New arrivals in onboarding" head={['Start', 'Project']} onOpen={onOpen}
        cases={cases
          .filter((c) => c.case.movement === 'NEW_HIRE' && c.assessment.decision !== 'CAN_CLOSE')
          .sort((a, b) => b.case.startDate.localeCompare(a.case.startDate))}
        cells={(c) => [date(c.case.startDate), c.case.project ?? missing]} />
      {cases.some((c) => has(c, 'STALE_STATUS')) && (
        <p className="muted">Some statuses are outdated and may not reflect reality.</p>
      )}
      <Management rows={cases.map(toRow)} onOpen={onOpen} />
    </>
  );
}
