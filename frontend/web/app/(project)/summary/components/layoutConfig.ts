import { ResponsiveLayouts } from 'react-grid-layout/legacy';

export interface WidgetLayout {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
  minW?: number;
  minH?: number;
  maxW?: number;
  maxH?: number;
  static?: boolean;
}

export type Layouts = ResponsiveLayouts<string>;

/**
 * Builds the default grid layout for different screen sizes (lg, md, sm).
 * Dynamically adjusts based on whether the project is Agile or Kanban.
 */
export function buildDefaultLayouts(isAgile: boolean): Layouts {
  const lg: WidgetLayout[] = [
    // Metric Row (Top)
    { i: 'metric-progress', x: 0, y: 0, w: 6, h: 2, minW: 3, minH: 2 },
    { i: 'metric-total', x: 6, y: 0, w: 6, h: 2, minW: 3, minH: 2 },
    { i: 'metric-completed', x: 12, y: 0, w: 6, h: 2, minW: 3, minH: 2 },
    { i: 'metric-due', x: 18, y: 0, w: 6, h: 2, minW: 3, minH: 2 },

    // Middle Section - Dynamic based on Project Type
    ...(isAgile ? [
      { i: 'report', x: 0, y: 2, w: 16, h: 1, minW: 6, minH: 1 },
      { i: 'sprint', x: 0, y: 3, w: 16, h: 3, minW: 8, minH: 3 },
      { i: 'activity-feed', x: 16, y: 2, w: 8, h: 4, minW: 4, minH: 3 },
    ] : [
      { i: 'report', x: 0, y: 2, w: 16, h: 1, minW: 6, minH: 1 },
      { i: 'task-dist', x: 0, y: 3, w: 16, h: 4, minW: 5, minH: 4 },
      { i: 'activity-feed', x: 16, y: 2, w: 8, h: 5, minW: 4, minH: 3 },
    ]),

    // Agile specific charts
    ...(isAgile ? [
      { i: 'burndown', x: 0, y: 6, w: 6, h: 4, minW: 3, minH: 3 },
      { i: 'task-dist', x: 6, y: 6, w: 6, h: 4, minW: 3, minH: 3 },
      { i: 'velocity', x: 12, y: 6, w: 6, h: 4, minW: 3, minH: 3 },
      { i: 'lead-time', x: 18, y: 6, w: 6, h: 4, minW: 3, minH: 3 },
    ] : []),

    // Tasks and Milestones
    { i: 'recently-completed', x: 0, y: isAgile ? 10 : 7, w: 8, h: 5, minW: 4, minH: 3 },
    { i: 'due-tasks', x: 8, y: isAgile ? 10 : 7, w: 8, h: 5, minW: 4, minH: 3 },
    { i: 'milestones', x: 16, y: isAgile ? 10 : 7, w: 8, h: 5, minW: 4, minH: 3 },

    // Bottom Section: Docs, Notes, Chat
    { i: 'docs', x: 0, y: isAgile ? 15 : 12, w: 6, h: 5, minW: 3, minH: 3 },
    { i: 'notes', x: 6, y: isAgile ? 15 : 12, w: 6, h: 5, minW: 3, minH: 3 },
    { i: 'chat', x: 12, y: isAgile ? 15 : 12, w: 12, h: 5, minW: 6, minH: 4 },
  ];

  const md: WidgetLayout[] = [
    { i: 'metric-progress', x: 0, y: 0, w: 6, h: 2, minW: 3, minH: 2 },
    { i: 'metric-total', x: 6, y: 0, w: 6, h: 2, minW: 3, minH: 2 },
    { i: 'metric-completed', x: 0, y: 2, w: 6, h: 2, minW: 3, minH: 2 },
    { i: 'metric-due', x: 6, y: 2, w: 6, h: 2, minW: 3, minH: 2 },
    { i: 'report', x: 0, y: 4, w: 12, h: 1, minW: 6, minH: 1 },

    ...(isAgile ? [
      { i: 'sprint', x: 0, y: 5, w: 12, h: 3, minW: 6, minH: 3 },
      { i: 'activity-feed', x: 0, y: 8, w: 12, h: 4, minW: 4, minH: 3 },
      { i: 'burndown', x: 0, y: 12, w: 6, h: 4, minW: 4, minH: 3 },
      { i: 'task-dist', x: 6, y: 12, w: 6, h: 4, minW: 4, minH: 3 },
      { i: 'velocity', x: 0, y: 16, w: 6, h: 4, minW: 4, minH: 3 },
      { i: 'lead-time', x: 6, y: 16, w: 6, h: 4, minW: 4, minH: 3 },
    ] : [
      { i: 'task-dist', x: 0, y: 5, w: 12, h: 4, minW: 5, minH: 4 },
      { i: 'activity-feed', x: 0, y: 9, w: 12, h: 4, minW: 4, minH: 3 },
    ]),

    { i: 'recently-completed', x: 0, y: isAgile ? 20 : 13, w: 4, h: 5, minW: 4, minH: 3 },
    { i: 'due-tasks', x: 4, y: isAgile ? 20 : 13, w: 4, h: 5, minW: 4, minH: 3 },
    { i: 'milestones', x: 8, y: isAgile ? 20 : 13, w: 4, h: 5, minW: 4, minH: 3 },
    { i: 'docs', x: 0, y: isAgile ? 25 : 18, w: 3, h: 5, minW: 3, minH: 3 },
    { i: 'notes', x: 3, y: isAgile ? 25 : 18, w: 3, h: 5, minW: 3, minH: 3 },
    { i: 'chat', x: 6, y: isAgile ? 25 : 18, w: 6, h: 5, minW: 5, minH: 4 },
  ];

  const sm: WidgetLayout[] = [
    { i: 'metric-progress', x: 0, y: 0, w: 4, h: 2, static: true },
    { i: 'metric-total', x: 0, y: 2, w: 4, h: 2, static: true },
    { i: 'metric-completed', x: 0, y: 4, w: 4, h: 2, static: true },
    { i: 'metric-due', x: 0, y: 6, w: 4, h: 2, static: true },
    { i: 'report', x: 0, y: 8, w: 4, h: 1, static: true },
    
    ...(isAgile ? [
      { i: 'sprint', x: 0, y: 9, w: 4, h: 3, static: true },
      { i: 'activity-feed', x: 0, y: 12, w: 4, h: 4, static: true },
      { i: 'burndown', x: 0, y: 16, w: 4, h: 4, static: true },
      { i: 'task-dist', x: 0, y: 20, w: 4, h: 4, static: true },
      { i: 'velocity', x: 0, y: 24, w: 4, h: 4, static: true },
      { i: 'lead-time', x: 0, y: 28, w: 4, h: 4, static: true },
    ] : [
      { i: 'task-dist', x: 0, y: 9, w: 4, h: 4, static: true },
      { i: 'activity-feed', x: 0, y: 13, w: 4, h: 4, static: true },
    ]),

    { i: 'notes', x: 0, y: isAgile ? 32 : 17, w: 4, h: 5, static: true },
    { i: 'recently-completed', x: 0, y: isAgile ? 37 : 22, w: 4, h: 5, static: true },
    { i: 'due-tasks', x: 0, y: isAgile ? 42 : 27, w: 4, h: 4, static: true },
    { i: 'milestones', x: 0, y: isAgile ? 46 : 31, w: 4, h: 4, static: true },
    { i: 'docs', x: 0, y: isAgile ? 50 : 35, w: 4, h: 4, static: true },
    { i: 'chat', x: 0, y: isAgile ? 54 : 39, w: 4, h: 5, static: true },
  ];

  return { lg, md, sm } as Layouts;
}
