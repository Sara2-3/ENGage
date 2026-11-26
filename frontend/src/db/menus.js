// The side menu of each role: one page per subject, so a dashboard is not one long screen.
// The first entry is the page shown after sign-in.
export const menus = {
  PMO: [
    { key: 'overview', title: 'Overview' }, { key: 'employees', title: 'Employees' }, { key: 'projects', title: 'Projects' },
    { key: 'requests', title: 'HR requests' }, { key: 'line', title: 'Line Manager' }, { key: 'knowledge', title: 'Knowledge' },
  ],
  MANAGEMENT: [
    { key: 'overview', title: 'Overview' }, { key: 'intervention', title: 'Intervention' }, { key: 'reports', title: 'Reports' },
    { key: 'projects', title: 'Projects' }, { key: 'requests', title: 'HR requests' },
  ],
  ADDITIONAL_MANAGER: [
    { key: 'todo', title: 'Needs my action' }, { key: 'others', title: 'Other employees' }, { key: 'waiting', title: 'Assign projects' },
    { key: 'reports', title: 'Reports' }, { key: 'requests', title: 'Ask HR' },
  ],
  TECH_LEAD: [
    { key: 'todo', title: 'Needs my action' }, { key: 'others', title: 'Other employees' }, { key: 'knowledge', title: 'Knowledge' },
  ],
  LINE_MANAGER: [{ key: 'blockers', title: 'Blockers' }, { key: 'reports', title: 'Reports' }, { key: 'progress', title: 'Progress' }],
  EMPLOYEE: [{ key: 'profile', title: 'My profile' }, { key: 'work', title: 'My work' }, { key: 'update', title: 'Send an update' }],
  HR: [{ key: 'requests', title: 'Requests' }, { key: 'NEW_HIRE', title: 'New hires' }, { key: 'REALLOCATION', title: 'Reallocations' }],
};
