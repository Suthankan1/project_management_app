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

const COLORS = ['#0052CC', '#00875A', '#FF8B00', '#DE350B', '#FFC400', '#6554C0', '#36B37E', '#FF5630', '#2684FF', '#FF991F'];
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';

interface UserProfileItem {
  userId: number;
  email?: string;
  username?: string;
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

  const userProfiles = useMemo(() => {
    if (!usersData || usersData.length === 0) return {};
    const profilesMap: Record<string, string> = {};
    usersData.forEach((u) => {
      if (u.profilePicUrl) {
        const fullUrl = u.profilePicUrl.startsWith('http') ? u.profilePicUrl : `${API_BASE_URL}${u.profilePicUrl.startsWith('/') ? '' : '/'}${u.profilePicUrl}`;
        profilesMap[`id:${u.userId}`] = fullUrl;
        if (u.email) profilesMap[`email:${u.email}`] = fullUrl;
        if (u.username) profilesMap[`username:${u.username}`] = fullUrl;
      }
    });
    return profilesMap;
  }, [usersData]);

  const workloadData = useMemo(() => {
    const workloads: Record<string, Omit<WorkloadEntry, 'value' | 'color'>> = {};

    members.forEach(m => {
      let pathName = m.user.profilePicUrl;
      if (!pathName) {
        pathName = userProfiles[`id:${m.user.userId}`] || userProfiles[`email:${m.user.email}`] || userProfiles[`username:${m.user.username}`] || null;
      } else if (!pathName.startsWith('http')) {
        pathName = `${API_BASE_URL}${pathName.startsWith('/') ? '' : '/'}${pathName}`;
      }

      workloads[`M_${m.id}`] = {
        isMember: true,
        id: m.id,
        name: m.user.fullName || m.user.username,
        role: m.role,
        avatar: pathName,
        initials: (m.user.fullName || m.user.username || 'U').substring(0, 2).toUpperCase(),
        tasks: 0,
        completed: 0,
        overdue: 0
      };
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    tasks.forEach(t => {
      let key = "UNASSIGNED";
      if (t.assigneeId && workloads[`M_${t.assigneeId}`]) {
        key = `M_${t.assigneeId}`;
      } else if (t.assigneeName) {
        key = `O_${t.assigneeName}`;
        if (!workloads[key]) {
          workloads[key] = {
            isMember: false,
            name: t.assigneeName,
            avatar: t.assigneePhotoUrl,
            initials: t.assigneeName.substring(0, 2).toUpperCase(),
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
    <MotionWrapper className="relative bg-white/60 backdrop-blur-2xl rounded-2xl border border-white/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-300 overflow-hidden">
      {/* Decorative gradient blob background for glass effect */}
      <div className="absolute top-[-50%] left-[-10%] w-[60%] h-[150%] bg-gradient-to-r from-blue-100/40 to-emerald-50/40 rounded-full blur-3xl -z-10 animate-pulse pointer-events-none" style={{ animationDuration: '8s' }} />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[100%] bg-gradient-to-l from-amber-50/40 to-purple-50/40 rounded-full blur-3xl -z-10 animate-pulse pointer-events-none" style={{ animationDuration: '10s' }} />

      <div className="p-5 border-b border-white/50 flex items-center justify-between bg-white/40">
        <h2 className="font-arimo text-[16px] font-semibold text-[#101828] flex items-center gap-2">
          <Briefcase size={18} className="text-[#0052CC]" />
          Team Workload Distribution
        </h2>
      </div>

      <div className="flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x divide-white/50">
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
