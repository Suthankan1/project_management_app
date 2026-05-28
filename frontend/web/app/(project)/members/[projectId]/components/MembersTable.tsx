import type React from 'react';
import Image from 'next/image';
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
  return (
    <div className="bg-cu-bg rounded-lg shadow">
      <div>
        <div
          className="relative overflow-x-auto mobile-scroll touch-pan-x pb-2"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          <div className="md:hidden text-center text-[11px] text-cu-text-muted mb-2">Swipe sideways to view all columns</div>
          <table className="min-w-full max-md:min-w-[680px] text-xs sm:text-sm">
            <thead>
              <tr className="border-b">
                <th className="px-6 py-3 text-left text-xs sm:text-sm font-semibold text-cu-text-secondary whitespace-nowrap max-md:min-w-[170px] max-md:border-r max-md:border-cu-border">
                  Member
                </th>
                <th className="px-4 py-3 text-left text-xs sm:text-sm font-semibold text-cu-text-secondary whitespace-nowrap max-md:min-w-[120px] max-md:border-l max-md:border-cu-border">Role</th>
                <th className="px-4 py-3 text-left text-xs sm:text-sm font-semibold text-cu-text-secondary whitespace-nowrap max-md:min-w-[100px] max-md:border-l max-md:border-cu-border">Status</th>
                <th className="px-4 py-3 text-left text-xs sm:text-sm font-semibold text-cu-text-secondary whitespace-nowrap max-md:min-w-[120px] max-md:border-l max-md:border-cu-border">Last Active</th>
                <th className="px-4 py-3 text-left text-xs sm:text-sm font-semibold text-cu-text-secondary whitespace-nowrap max-md:min-w-[90px] max-md:border-l max-md:border-cu-border">Tasks</th>
                <th className="px-4 py-3 whitespace-nowrap max-md:min-w-[110px] max-md:border-l max-md:border-cu-border"></th>
              </tr>
            </thead>
            <tbody>
              {filteredMembers.map((member) => {
                const avatarKey = `${member.id}-${member.user.email}`;
                const resolvedCandidates = getMemberProfilePicCandidates(member)
                  .map((url) => resolveProfilePicUrl(url))
                  .filter(Boolean);
                const resolvedProfilePicUrl = resolvedCandidates.find(
                  (url) => !brokenProfileImages[`${avatarKey}:${url}`],
                ) || '';

                return (
                  <tr key={member.id + member.user.email} className="border-b border-cu-border hover:bg-cu-hover">
                    <td className="px-6 py-3 flex items-center gap-3 max-md:min-w-[170px] max-md:border-r max-md:border-cu-border">
                      {resolvedProfilePicUrl && !brokenProfileImages[avatarKey] ? (
                        <Image
                          src={resolvedProfilePicUrl}
                          alt={member.user.fullName || member.user.email}
                          width={36}
                          height={36}
                          unoptimized={true}
                          className="w-9 h-9 rounded-full object-cover"
                          onError={() => setBrokenProfileImages((prev) => ({ ...prev, [`${avatarKey}:${resolvedProfilePicUrl}`]: true }))}
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-cu-primary flex items-center justify-center text-white font-bold text-base">
                          {member.user.fullName ? member.user.fullName.split(' ').map((name) => name[0]).join('') : member.user.email[0]?.toUpperCase()}
                        </div>
                      )}
                      <div className="max-md:max-w-[135px]">
                        <div className="font-medium text-cu-text-primary text-[12px] sm:text-sm truncate">{member.user.fullName || member.user.email}</div>
                        <div className="text-xs text-cu-text-muted truncate">{member.user.email}</div>
                      </div>
                    </td>

                    <td className="px-4 py-3 align-middle whitespace-nowrap max-md:min-w-[120px] max-md:border-l max-md:border-cu-border">
                      {canChangeRole(member) && member.user.userId ? (
                        <div className="relative inline-flex items-center">
                          <select
                            value={member.role}
                            onChange={(event) => onRoleChange(member.user.userId, event.target.value)}
                            disabled={changingRoleId === member.user.userId}
                            className={`appearance-none outline-none cursor-pointer pl-8 pr-7 h-10 max-md:min-h-[44px] rounded-md text-sm font-semibold leading-none ${ROLE_COLORS[member.role] || 'bg-gray-100 text-cu-text-secondary'}`}
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
                          <div className="absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none opacity-60">
                            {changingRoleId === member.user.userId ? (
                              <svg className="animate-spin h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                            ) : (
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6"/></svg>
                            )}
                          </div>
                        </div>
                      ) : (
                        <span className={`px-2 py-1 h-9 rounded text-sm font-semibold inline-flex items-center gap-1.5 w-max leading-none ${ROLE_COLORS[member.role] || 'bg-gray-100 text-cu-text-secondary'}`}>
                          {member.role === 'OWNER' && ICONS.owner}
                          {member.role === 'ADMIN' && ICONS.adminRole}
                          {member.role === 'MEMBER' && ICONS.member}
                          {member.role === 'VIEWER' && ICONS.viewer}
                          {ROLE_LABELS[member.role] || member.role}
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-3 align-middle whitespace-nowrap text-xs sm:text-sm max-md:min-w-[100px] max-md:border-l max-md:border-cu-border">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${STATUS_COLORS[member.status] || 'bg-gray-100 text-cu-text-secondary'}`}>{member.status}</span>
                    </td>

                    <td className="px-4 py-3 align-middle whitespace-nowrap text-xs sm:text-sm max-md:min-w-[120px] max-md:border-l max-md:border-cu-border">
                      {member.status === 'Pending' ? 'Never' : member.lastActive ? timeAgo(member.lastActive) : '-'}
                    </td>

                    <td className="px-4 py-3 font-semibold text-cu-primary align-middle whitespace-nowrap text-xs sm:text-sm max-md:min-w-[90px] max-md:border-l max-md:border-cu-border">{member.taskCount}</td>

                    <td className="px-4 py-3 text-right align-middle whitespace-nowrap max-md:min-w-[110px] max-md:border-l max-md:border-cu-border">
                      {canRemoveMember(member) && (
                        <button
                          onClick={() => onRequestRemove(member)}
                          className="p-1 px-3 max-md:min-h-[44px] rounded text-cu-danger hover:bg-cu-danger/10 font-medium text-sm transition-colors border border-transparent hover:border-cu-danger/20"
                          title="Remove Member"
                        >
                          Remove
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
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
