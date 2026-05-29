'use client';

// The main parent component that calculates task distribution and brings the chart and member list together.
import React, { useMemo, useState } from 'react';
import { Task, TeamMemberInfo } from '@/types';
import MotionWrapper from '../MotionWrapper';
import { Briefcase } from 'lucide-react';
import useSWR from 'swr';
import api from '@/lib/axios';

import { WorkloadEntry } from './types';
import { WorkloadPieChart } from './WorkloadPieChart';
import { WorkloadMembersList } from './WorkloadMembersList';
import { getInitials, profileLookupKey, resolveSummaryAvatarUrl } from '../avatar-utils';

const COLORS = [
  'var(--cu-primary)',
  'var(--cu-success)',
  'var(--cu-warning)',
  'var(--cu-danger)',
  'var(--cu-warning)',
  'var(--cu-primary-hover)',
  'var(--cu-success)',
  'var(--cu-danger)',
  'var(--cu-primary-light)',
  'var(--cu-warning)',
];
interface UserProfileItem {
  userId: number;
  email?: string;
  username?: string;
  fullName?: string;
  profilePicUrl?: string;
}

export function WorkloadDistribution({ projectId, tasks = [] }: { projectId: number | string; tasks: Task[] }) {
  const [activeIndex, setActiveIndex] = useState(-1);
  const fetcher = (url: string) => api.get(url).then(res => res.data);

  // Fetch members
  const { data: members = [] } = useSWR<TeamMemberInfo[]>(
    projectId ? `/api/projects/${projectId}/members` : null,
    fetcher
  );

  // Fetch user profiles globally to resolve mis-mapped avatars
  const { data: usersData = [] } = useSWR<UserProfileItem[]>(
    members.length > 0 ? '/api/auth/users' : null,
    fetcher
  );

  const userProfiles = useMemo<Record<string, string>>(() => {
    if (!usersData || usersData.length === 0) return {};
    const profilesMap: Record<string, string> = {};
    usersData.forEach((u) => {
      const fullUrl = resolveSummaryAvatarUrl(u.profilePicUrl);
      if (!fullUrl) return;

      profilesMap[`id:${profileLookupKey(u.userId)}`] = fullUrl;
      if (u.email) profilesMap[`email:${profileLookupKey(u.email)}`] = fullUrl;
      if (u.username) profilesMap[`username:${profileLookupKey(u.username)}`] = fullUrl;
      if (u.fullName) profilesMap[`fullname:${profileLookupKey(u.fullName)}`] = fullUrl;
    });
    return profilesMap;
  }, [usersData]);

  const workloadData = useMemo(() => {
    const workloads: Record<string, Omit<WorkloadEntry, 'value' | 'color'>> = {};
    const workloadByMemberId: Record<string, string> = {};
    const workloadByUserId: Record<string, string> = {};
    const workloadByName: Record<string, string> = {};

    members.forEach(m => {
      const memberName = m.user.fullName || m.user.username || 'Unknown member';
      const workloadKey = `M_${m.id}`;
      const profileUrl =
        resolveSummaryAvatarUrl(m.user.profilePicUrl) ||
        userProfiles[`id:${profileLookupKey(m.user.userId)}`] ||
        userProfiles[`email:${profileLookupKey(m.user.email)}`] ||
        userProfiles[`username:${profileLookupKey(m.user.username)}`] ||
        userProfiles[`fullname:${profileLookupKey(memberName)}`] ||
        null;

      workloadByMemberId[profileLookupKey(m.id)] = workloadKey;
      workloadByUserId[profileLookupKey(m.user.userId)] = workloadKey;
      [memberName, m.user.fullName, m.user.username, m.user.email].forEach((value) => {
        const key = profileLookupKey(value);
        if (key) workloadByName[key] = workloadKey;
      });

      workloads[workloadKey] = {
        isMember: true,
        id: m.id,
        name: memberName,
        role: m.role,
        avatar: profileUrl,
        initials: getInitials(memberName),
        tasks: 0,
        completed: 0,
        overdue: 0
      };
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    tasks.forEach(t => {
      let key = "UNASSIGNED";
      const assigneeIdKey = profileLookupKey(t.assigneeId ?? t.assignee?.id);
      const displayAssigneeName = t.assigneeName || t.assignee?.name;
      const assigneeNameKey = profileLookupKey(displayAssigneeName);

      if (assigneeIdKey && (workloadByMemberId[assigneeIdKey] || workloadByUserId[assigneeIdKey])) {
        key = workloadByMemberId[assigneeIdKey] || workloadByUserId[assigneeIdKey];
      } else if (assigneeNameKey && workloadByName[assigneeNameKey]) {
        key = workloadByName[assigneeNameKey];
      } else if (displayAssigneeName) {
        key = `O_${displayAssigneeName}`;
        if (!workloads[key]) {
          workloads[key] = {
            isMember: false,
            name: displayAssigneeName,
            avatar: resolveSummaryAvatarUrl(t.assigneePhotoUrl || t.assignee?.avatar || t.assignee?.profilePicUrl),
            initials: getInitials(displayAssigneeName),
            tasks: 0, completed: 0, overdue: 0
          };
        }
      } else {
        if (!workloads["UNASSIGNED"]) {
          workloads["UNASSIGNED"] = {
            isMember: false,
            name: 'Unassigned',
            tasks: 0, completed: 0, overdue: 0
          };
        }
      }

      workloads[key].tasks += 1;
      if (t.status === 'DONE' || t.status === 'COMPLETED') {
        workloads[key].completed += 1;
      } else if (t.dueDate && new Date(t.dueDate) < today) {
        workloads[key].overdue += 1;
      }
    });

    return Object.values(workloads)
      .sort((a, b) => b.tasks - a.tasks || (a.isMember === b.isMember ? 0 : a.isMember ? -1 : 1)) 
      .map((data, index) => ({
        ...data,
        value: data.tasks,
        color: COLORS[index % COLORS.length]
      }));
  }, [members, tasks, userProfiles]);

  const activeWorkloadData = useMemo(() => workloadData.filter(d => d.value > 0), [workloadData]);

  if (workloadData.length === 0 && members.length === 0) {
    return null; 
  }

  return (
    <MotionWrapper className="relative bg-cu-bg/90 backdrop-blur-2xl rounded-2xl border border-cu-border shadow-cu-sm hover:shadow-cu-md transition-all duration-300 overflow-hidden">
      {/* Decorative gradient blob background for glass effect */}
      <div className="absolute top-[-50%] left-[-10%] w-[60%] h-[150%] bg-gradient-to-r from-cu-primary/10 to-cu-success/10 rounded-full blur-3xl -z-10 animate-pulse pointer-events-none" style={{ animationDuration: '8s' }} />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[100%] bg-gradient-to-l from-cu-warning/10 to-cu-primary/10 rounded-full blur-3xl -z-10 animate-pulse pointer-events-none" style={{ animationDuration: '10s' }} />

      <div className="p-5 border-b border-cu-border flex items-center justify-between bg-cu-bg-secondary/60">
        <h2 className="font-arimo text-[16px] font-semibold text-cu-text-primary flex items-center gap-2">
          <Briefcase size={18} className="text-cu-primary" />
          Team Workload Distribution
        </h2>
      </div>

      <div className="flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x divide-cu-border">
        <WorkloadPieChart 
          projectId={projectId}
          membersLength={members.length}
          tasksLength={tasks.length}
          activeWorkloadData={activeWorkloadData}
          activeIndex={activeIndex}
          setActiveIndex={setActiveIndex}
        />
        
        <WorkloadMembersList 
          workloadData={workloadData}
          activeWorkloadData={activeWorkloadData}
          activeIndex={activeIndex}
          setActiveIndex={setActiveIndex}
        />
      </div>
    </MotionWrapper>
  );
}
