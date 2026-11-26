// In order of seniority. HR supports the chain by finding people.
export const roles = [
  { key: 'PMO', title: 'PMO', task: 'Sees the whole system' },
  { key: 'MANAGEMENT', title: 'Management', task: 'Reviews reports' },
  { key: 'ADDITIONAL_MANAGER', title: 'Additional Manager', task: 'Asks HR, assigns projects' },
  { key: 'LINE_MANAGER', title: 'Line Manager', task: 'Progress and blockers' },
  { key: 'TECH_LEAD', title: 'Technical Lead', task: 'Gives technical tasks' },
  { key: 'EMPLOYEE', title: 'Employee', task: 'Does the tasks' },
  { key: 'HR', title: 'HR', task: 'Support: finds people' },
];

// Professional directions of new hires, with a short description of each.
export const directionInfo = {
  Java: 'Back-end applications and services written in Java.',
  '.NET': 'Applications and services built with C# on the Microsoft .NET platform.',
  Angular: 'Web interfaces built with Angular and TypeScript.',
  SAP: 'Setting up and developing SAP business systems.',
  'Microsoft Dynamics': 'Setting up and extending Microsoft Dynamics for customer and business processes.',
};
export const directions = Object.keys(directionInfo);
