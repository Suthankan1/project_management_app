import type React from 'react';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Trash2 } from 'lucide-react';
import { ROLE_COLORS, ROLE_LABELS, STATUS_COLORS, ICONS } from '../constants';
import type { Member, MemberCombined } from '../types';
import { timeAgo } from '../utils';

interface MembersTableProps {
  filteredMembers: MemberCombined[];
  brokenProfileImages: Record<string, boolean>;
  changingRoleId: number | null;
  canChangeRole: (member: MemberCombined) => boolean;
  canRemoveMember: (member: MemberCombined) => boolean;
  getAvailableOptions: () => string[];
  resolveProfilePicUrl: (profilePicUrl?: string) => string;
  getMemberProfilePicCandidates: (member: Member) => string[];
  setBrokenProfileImages: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  onRoleChange: (userId: number, newRole: string) => void;
  onRequestRemove: (member: MemberCombined) => void;
}

interface MemberAvatarProps {
  member: MemberCombined;
  brokenProfileImages: Record<string, boolean>;
  resolveProfilePicUrl: (profilePicUrl?: string) => string;
  getMemberProfilePicCandidates: (member: Member) => string[];
  setBrokenProfileImages: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  sizeClassName?: string;
}

function getInitials(member: MemberCombined) {
  if (member.user.fullName) {
    return member.user.fullName
      .split(' ')
      .map((name) => name[0])
      .join('');
  }

  return member.user.email[0]?.toUpperCase();
}

function useIsMobileMembersView() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') {
      return undefined;
    }

    const mediaQuery = window.matchMedia('(max-width: 767px)');
    const handleChange = () => setIsMobile(mediaQuery.matches);

    handleChange();
    mediaQuery.addEventListener('change', handleChange);

    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return isMobile;
}

function MemberAvatar({
  member,
  brokenProfileImages,
  resolveProfilePicUrl,
  getMemberProfilePicCandidates,
  setBrokenProfileImages,
  sizeClassName = 'w-9 h-9',
}: MemberAvatarProps) {
  const avatarKey = `${member.id}-${member.user.email}`;
  const resolvedCandidates = getMemberProfilePicCandidates(member)
    .map((url) => resolveProfilePicUrl(url))
    .filter(Boolean);
  const resolvedProfilePicUrl = resolvedCandidates.find(
    (url) => !brokenProfileImages[`${avatarKey}:${url}`],
  ) || '';

  if (resolvedProfilePicUrl && !brokenProfileImages[avatarKey]) {
    return (
      <Image
        src={resolvedProfilePicUrl}
        alt={member.user.fullName || member.user.email}
        width={44}
        height={44}
        unoptimized={true}
        className={`${sizeClassName} rounded-full object-cover shrink-0`}
        onError={() => setBrokenProfileImages((prev) => ({ ...prev, [`${avatarKey}:${resolvedProfilePicUrl}`]: true }))}
      />
    );
  }

  return (
    <div className={`${sizeClassName} rounded-full bg-cu-primary flex items-center justify-center text-white font-bold text-base shrink-0`}>
      {getInitials(member)}
    </div>
  );
}

interface RoleControlProps {
  member: MemberCombined;
  changingRoleId: number | null;
  canChangeRole: (member: MemberCombined) => boolean;
  getAvailableOptions: () => string[];
  onRoleChange: (userId: number, newRole: string) => void;
  compact?: boolean;
}

function RoleControl({
  member,
  changingRoleId,
  canChangeRole,
  getAvailableOptions,
  onRoleChange,
  compact = false,
}: RoleControlProps) {
  if (canChangeRole(member) && member.user.userId) {
    return (
      <div className="relative inline-flex items-center w-full sm:w-auto">
        <select
          value={member.role}
          onChange={(event) => onRoleChange(member.user.userId, event.target.value)}
          disabled={changingRoleId === member.user.userId}
          className={`appearance-none outline-none cursor-pointer pl-8 pr-8 h-11 rounded-md text-sm font-semibold leading-none w-full sm:w-auto ${ROLE_COLORS[member.role] || 'bg-gray-100 text-cu-text-secondary'}`}
        >
          {getAvailableOptions().map((opt) => (
            <option key={opt} value={opt}>{ROLE_LABELS[opt] || opt}</option>
          ))}
        </select>
        <div className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none flex items-center justify-center w-3.5 h-3.5">
          {member.role === 'OWNER' && ICONS.owner}
          {member.role === 'ADMIN' && ICONS.adminRole}
          {member.role === 'MEMBER' && ICONS.member}
          {member.role === 'VIEWER' && ICONS.viewer}
        </div>
        <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-60">
          {changingRoleId === member.user.userId ? (
            <svg className="animate-spin h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
          ) : (
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6"/></svg>
          )}
        </div>
      </div>
    );
  }

  return (
    <span className={`px-2 py-1 ${compact ? 'h-8 text-xs' : 'h-9 text-sm'} rounded font-semibold inline-flex items-center gap-1.5 w-max leading-none ${ROLE_COLORS[member.role] || 'bg-gray-100 text-cu-text-secondary'}`}>
      {member.role === 'OWNER' && ICONS.owner}
      {member.role === 'ADMIN' && ICONS.adminRole}
      {member.role === 'MEMBER' && ICONS.member}
      {member.role === 'VIEWER' && ICONS.viewer}
      {ROLE_LABELS[member.role] || member.role}
    </span>
  );
}

export function MembersTable({
  filteredMembers,
  brokenProfileImages,
  changingRoleId,
  canChangeRole,
  canRemoveMember,
  getAvailableOptions,
  resolveProfilePicUrl,
  getMemberProfilePicCandidates,
  setBrokenProfileImages,
  onRoleChange,
  onRequestRemove,
}: MembersTableProps) {
  const isMobile = useIsMobileMembersView();

  if (isMobile) {
    return (
      <div className="space-y-3">
        {filteredMembers.map((member) => (
          <article key={`mobile-${member.id}-${member.user.email}`} className="rounded-xl border border-cu-border bg-cu-bg p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-start gap-3">
                <MemberAvatar
                  member={member}
                  brokenProfileImages={brokenProfileImages}
                  resolveProfilePicUrl={resolveProfilePicUrl}
                  getMemberProfilePicCandidates={getMemberProfilePicCandidates}
                  setBrokenProfileImages={setBrokenProfileImages}
                  sizeClassName="w-11 h-11"
                />
                <div className="min-w-0">
                  <h2 className="truncate text-[15px] font-semibold text-cu-text-primary">{member.user.fullName || member.user.email}</h2>
                  <p className="truncate text-xs text-cu-text-muted">{member.user.email}</p>
                </div>
              </div>
              <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_COLORS[member.status] || 'bg-gray-100 text-cu-text-secondary'}`}>{member.status}</span>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 rounded-lg bg-cu-hover p-3">
              <div>
                <p className="text-[11px] font-medium uppercase text-cu-text-muted">Last active</p>
                <p className="mt-1 text-sm font-semibold text-cu-text-primary">{member.status === 'Pending' ? 'Never' : member.lastActive ? timeAgo(member.lastActive) : '-'}</p>
              </div>
              <div>
                <p className="text-[11px] font-medium uppercase text-cu-text-muted">Tasks</p>
                <p className="mt-1 text-sm font-semibold text-cu-primary">{member.taskCount}</p>
              </div>
            </div>

            <div className="mt-4 flex flex-col gap-3">
              <RoleControl
                member={member}
                changingRoleId={changingRoleId}
                canChangeRole={canChangeRole}
                getAvailableOptions={getAvailableOptions}
                onRoleChange={onRoleChange}
                compact
              />
              {canRemoveMember(member) && (
                <button
                  onClick={() => onRequestRemove(member)}
                  className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-lg border border-cu-danger/20 bg-cu-danger/10 px-3 text-sm font-semibold text-cu-danger transition-colors hover:bg-cu-danger/15"
                  title="Remove Member"
                >
                  <Trash2 size={16} aria-hidden="true" />
                  Remove
                </button>
              )}
            </div>
          </article>
        ))}
        {filteredMembers.length === 0 && (
          <div className="rounded-xl border border-dashed border-cu-border bg-cu-bg px-4 py-8 text-center text-sm text-cu-text-muted">
            No members found.
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-cu-bg rounded-lg shadow">
      <div>
        <div
          className="relative overflow-x-auto mobile-scroll touch-pan-x pb-2"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          <table className="min-w-full text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-cu-border">
                <th className="px-6 py-3 text-left text-xs sm:text-sm font-semibold text-cu-text-secondary whitespace-nowrap">
                  Member
                </th>
                <th className="px-4 py-3 text-left text-xs sm:text-sm font-semibold text-cu-text-secondary whitespace-nowrap">Role</th>
                <th className="px-4 py-3 text-left text-xs sm:text-sm font-semibold text-cu-text-secondary whitespace-nowrap">Status</th>
                <th className="px-4 py-3 text-left text-xs sm:text-sm font-semibold text-cu-text-secondary whitespace-nowrap">Last Active</th>
                <th className="px-4 py-3 text-left text-xs sm:text-sm font-semibold text-cu-text-secondary whitespace-nowrap">Tasks</th>
                <th className="px-4 py-3 whitespace-nowrap"></th>
              </tr>
            </thead>
            <tbody>
              {filteredMembers.map((member) => (
                <tr key={member.id + member.user.email} className="border-b border-cu-border hover:bg-cu-hover">
                  <td className="px-6 py-3 flex items-center gap-3">
                    <MemberAvatar
                      member={member}
                      brokenProfileImages={brokenProfileImages}
                      resolveProfilePicUrl={resolveProfilePicUrl}
                      getMemberProfilePicCandidates={getMemberProfilePicCandidates}
                      setBrokenProfileImages={setBrokenProfileImages}
                    />
                    <div>
                      <div className="font-medium text-cu-text-primary text-[12px] sm:text-sm truncate">{member.user.fullName || member.user.email}</div>
                      <div className="text-xs text-cu-text-muted truncate">{member.user.email}</div>
                    </div>
                  </td>

                  <td className="px-4 py-3 align-middle whitespace-nowrap">
                    <RoleControl
                      member={member}
                      changingRoleId={changingRoleId}
                      canChangeRole={canChangeRole}
                      getAvailableOptions={getAvailableOptions}
                      onRoleChange={onRoleChange}
                    />
                  </td>

                  <td className="px-4 py-3 align-middle whitespace-nowrap text-xs sm:text-sm">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[member.status] || 'bg-gray-100 text-cu-text-secondary'}`}>{member.status}</span>
                  </td>

                  <td className="px-4 py-3 align-middle whitespace-nowrap text-xs sm:text-sm">
                    {member.status === 'Pending' ? 'Never' : member.lastActive ? timeAgo(member.lastActive) : '-'}
                  </td>

                  <td className="px-4 py-3 font-semibold text-cu-primary align-middle whitespace-nowrap text-xs sm:text-sm">{member.taskCount}</td>

                  <td className="px-4 py-3 text-right align-middle whitespace-nowrap">
                    {canRemoveMember(member) && (
                      <button
                        onClick={() => onRequestRemove(member)}
                        className="inline-flex items-center gap-2 min-h-[36px] px-3 rounded-lg border border-cu-danger/20 bg-cu-danger/10 text-sm font-semibold text-cu-danger hover:bg-cu-danger/15 transition-colors"
                        title="Remove Member"
                      >
                        <Trash2 size={15} aria-hidden="true" />
                        Remove
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {filteredMembers.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-cu-text-muted">No members found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
