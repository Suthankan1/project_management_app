export * from './contract-common';
export * from './auth-contract';
export * from './projects-contract';
export * from './tasks-contract';
export * from './collaboration-contract';
export * from './system-contract';

import { authApi } from './auth-contract';
import { projectsApi, portfoliosApi } from './projects-contract';
import {
  tasksApi,
  sprintsApi,
  sprintboardsApi,
  kanbanApi,
  labelsApi,
  milestonesApi,
} from './tasks-contract';
import { documentsApi, pagesApi, chatApi } from './collaboration-contract';
import { notificationsApi, gitHubApi, reportsApi } from './system-contract';

export const apiContract = {
  auth: authApi,
  projects: projectsApi,
  tasks: tasksApi,
  sprints: sprintsApi,
  sprintboards: sprintboardsApi,
  kanban: kanbanApi,
  labels: labelsApi,
  milestones: milestonesApi,
  documents: documentsApi,
  pages: pagesApi,
  chat: chatApi,
  notifications: notificationsApi,
  GitHub: gitHubApi,
  reports: reportsApi,
  portfolios: portfoliosApi,
};

export default apiContract;
