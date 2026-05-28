import { useMemo } from 'react';
import { usePathname } from 'next/navigation';

export function useProjectTabs(projectId: string | null, isAgile: boolean) {
  const pathname = usePathname();

  const tabs = useMemo(() => {
    const base = [
      { id: 'summary',    label: 'Summary' },
      { id: 'timeline',   label: 'Timeline' },
      { id: 'backlog',    label: 'Backlog' },
      { id: 'board',      label: 'Board' },
      { id: 'calendar',   label: 'Calendar' },
    ];

    if (isAgile) {
      base.push({ id: 'burndown', label: 'Burndown' });
    }

    base.push(
      { id: 'chats',      label: 'Chats' },
      { id: 'milestones', label: 'Milestones' },
      { id: 'members',    label: 'Members' },
      { id: 'dms',        label: 'DMS' },
      { id: 'list',       label: 'List' },
      { id: 'report',     label: 'Report' },
    );

    return base;
  }, [isAgile]);

  const activeTab = useMemo(() => {
    if (pathname.startsWith('/summary'))   return 'summary';
    if (pathname.startsWith('/timeline'))  return 'timeline';
    if (pathname.startsWith('/sprint-backlog') || pathname.startsWith('/backlog')) return 'backlog';
    if (pathname.startsWith('/kanban') || pathname.startsWith('/sprint-board'))   return 'board';
    if (pathname.startsWith('/list'))       return 'list';
    if (pathname.startsWith('/calendar'))  return 'calendar';
    if (pathname.startsWith('/burndown'))  return 'burndown';
    if (pathname.startsWith('/milestones'))return 'milestones';
    if (pathname.startsWith('/workload'))  return 'workload';
    if (pathname.startsWith('/project/') && pathname.includes('/chat')) return 'chats';
    if (pathname.startsWith('/project/') && pathname.includes('/settings')) return 'settings';
    if (pathname.startsWith('/members'))  return 'members';
    if (pathname.startsWith('/pages') || pathname.startsWith('/folders')) return 'dms';
    if (pathname.startsWith('/report'))   return 'report';
    if (pathname.startsWith('/github'))   return 'github';
    return 'summary';
  }, [pathname]);

  const withProjectId = (basePath: string) => {
    if (!projectId) return basePath;
    return `${basePath}?projectId=${projectId}`;
  };

  const getTabHref = (tabId: string) => {
    switch (tabId) {
      case 'summary':    return projectId ? `/summary/${projectId}` : '/dashboard';
      case 'timeline':   return withProjectId('/timeline');
      case 'backlog':    return isAgile ? withProjectId('/sprint-backlog') : withProjectId('/backlog');
      case 'board':      return isAgile ? withProjectId('/sprint-board')   : withProjectId('/kanban');
      case 'list':       return withProjectId('/list');
      case 'calendar':   return withProjectId('/calendar');
      case 'burndown':   return withProjectId('/burndown');
      case 'chats':      return projectId ? `/project/${projectId}/chat` : '/dashboard';
      case 'milestones': return withProjectId('/milestones');
      case 'workload':   return withProjectId('/workload');
      case 'members':    return projectId ? `/members/${projectId}` : '/members';
      case 'dms':        return withProjectId('/pages');
      case 'report':     return projectId ? `/report/${projectId}` : '/dashboard';
      case 'github':     return projectId ? `/github/${projectId}` : '/dashboard';
      default:           return projectId ? `/summary/${projectId}` : '/dashboard';
    }
  };

  const isProjectPage = useMemo(() => {
    if (pathname.startsWith('/dashboard/notifications')) return false;
    if (pathname.startsWith('/inbox')) return false;
    if (pathname.startsWith('/project/') && pathname.includes('/chat')) return true;
    if (pathname.startsWith('/project/') && pathname.includes('/settings')) return true;

    const hasProjectContext = Boolean(projectId);
    const projectScopedPaths = [
      '/summary',
      '/timeline',
      '/sprint-backlog',
      '/backlog',
      '/kanban',
      '/sprint-board',
      '/calendar',
      '/burndown',
      '/list',
      '/milestones',
      '/workload',
      '/pages',
      '/folders',
      '/notifications',
      '/members',
      '/report',
      '/github',
    ];
    return hasProjectContext && projectScopedPaths.some(path => pathname.startsWith(path));
  }, [pathname, projectId]);

  return { tabs, activeTab, getTabHref, isProjectPage };
}
