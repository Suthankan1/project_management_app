'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  AlertTriangle, Trash2, LogOut,
  Layers, FileText, Shield, Loader2, CheckCircle2,
  X, Info,
} from 'lucide-react';
import * as projectsApi from '@/services/projects-service';
import { toast } from '@/components/ui';
import {
  setScopedProjectValue,
  removeScopedProjectValue,
} from '@/hooks/useProjectContext';
import { getUserIdFromToken } from '@/lib/auth';
type ProjectType = 'AGILE' | 'KANBAN';

interface ProjectData {
  id: number;
  name: string;
  description: string;
  projectKey?: string;
  type: ProjectType;
  teamId?: number;
  teamName?: string;
  ownerId?: number;
  ownerName?: string;
  createdAt?: string;
}

// ── Section card shell ─────────────────────────────────────────────────────────

function SectionCard({
  title,
  description,
  icon,
  children,
}: {
  title: string;
  description?: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
      <div className="px-5 sm:px-6 py-4 border-b border-slate-100 bg-slate-50/60">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-500 shadow-sm shrink-0">
            {icon}
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-800">{title}</h2>
            {description && (
              <p className="text-xs text-slate-500 mt-0.5">{description}</p>
            )}
          </div>
        </div>
      </div>
      <div className="px-5 sm:px-6 py-5">{children}</div>
    </div>
  );
}

// ── Delete confirmation modal ──────────────────────────────────────────────────

function DeleteConfirmModal({
  open,
  projectName,
  onClose,
  onConfirm,
  isDeleting,
}: {
  open: boolean;
  projectName: string;
  onClose: () => void;
  onConfirm: () => void;
  isDeleting: boolean;
}) {
  const [confirmText, setConfirmText] = useState('');
  const canDelete = confirmText === projectName;

  const handleClose = useCallback(() => {
    setConfirmText('');
    onClose();
  }, [onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={!isDeleting ? handleClose : undefined}
      />
      <div className="relative bg-white w-full sm:rounded-2xl sm:max-w-md shadow-2xl border-0 sm:border sm:border-slate-200 rounded-t-2xl overflow-hidden animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-5 sm:px-6 pt-5 sm:pt-6 pb-4">
          <div className="flex items-start gap-4">
            <div className="w-11 h-11 rounded-full bg-red-50 ring-4 ring-red-50 flex items-center justify-center shrink-0">
              <AlertTriangle size={22} className="text-red-500" />
            </div>
            <div className="flex-1 min-w-0 pt-0.5">
              <h3 className="text-base font-bold text-slate-900">Delete Project</h3>
              <p className="text-sm text-slate-500 mt-0.5">
                This action is <span className="font-semibold text-slate-700">permanent</span> and cannot be undone.
              </p>
            </div>
            {!isDeleting && (
              <button
                onClick={handleClose}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors shrink-0"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Consequences */}
        <div className="mx-5 sm:mx-6 mb-4 bg-red-50 border border-red-100 rounded-xl p-4">
          <p className="text-[11px] font-bold text-red-700 mb-2.5 uppercase tracking-wider">
            Everything that will be deleted
          </p>
          <ul className="space-y-1.5">
            {[
              'All tasks, subtasks, and their attachments',
              'All sprint data, boards, and history',
              'All team member associations',
              'All custom fields and configurations',
              'All milestones and project documents',
            ].map((item) => (
              <li key={item} className="flex items-start gap-2 text-xs text-red-700">
                <span className="mt-[5px] w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Confirm input */}
        <div className="px-5 sm:px-6 pb-4">
          <label className="block text-xs font-semibold text-slate-700 mb-2">
            Type{' '}
            <span className="font-mono bg-slate-100 text-slate-900 px-1.5 py-0.5 rounded text-[11px]">
              {projectName}
            </span>{' '}
            to confirm:
          </label>
          <input
            autoFocus
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder={projectName}
            disabled={isDeleting}
            className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400 transition-all disabled:opacity-60 bg-white"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && canDelete && !isDeleting) onConfirm();
            }}
          />
          {confirmText.length > 0 && !canDelete && (
            <p className="mt-1.5 text-[11px] text-red-500 flex items-center gap-1">
              <span className="inline-block w-1 h-1 rounded-full bg-red-400 mt-0.5" />
              Project name does not match
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="px-5 sm:px-6 pb-5 sm:pb-6 flex gap-3">
          <button
            onClick={handleClose}
            disabled={isDeleting}
            className="flex-1 h-10 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={!canDelete || isDeleting}
            className="flex-1 h-10 bg-red-500 text-white rounded-xl text-sm font-semibold hover:bg-red-600 active:bg-red-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isDeleting ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Deleting…
              </>
            ) : (
              <>
                <Trash2 size={14} />
                Delete Project
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Leave confirmation modal ───────────────────────────────────────────────────

function LeaveConfirmModal({
  open,
  projectName,
  onClose,
  onConfirm,
  isLeaving,
}: {
  open: boolean;
  projectName: string;
  onClose: () => void;
  onConfirm: () => void;
  isLeaving: boolean;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={!isLeaving ? onClose : undefined}
      />
      <div className="relative bg-white w-full sm:rounded-2xl sm:max-w-md shadow-2xl border-0 sm:border sm:border-slate-200 rounded-t-2xl overflow-hidden animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200">
        <div className="px-5 sm:px-6 pt-5 sm:pt-6 pb-4">
          <div className="flex items-start gap-4">
            <div className="w-11 h-11 rounded-full bg-orange-50 ring-4 ring-orange-50 flex items-center justify-center shrink-0">
              <LogOut size={22} className="text-orange-500" />
            </div>
            <div className="flex-1 min-w-0 pt-0.5">
              <h3 className="text-base font-bold text-slate-900">Leave Project</h3>
              <p className="text-sm text-slate-500 mt-0.5">
                You will lose access to{' '}
                <span className="font-semibold text-slate-700">{projectName}</span> immediately.
              </p>
            </div>
            {!isLeaving && (
              <button
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors shrink-0"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        <div className="mx-5 sm:mx-6 mb-4 bg-orange-50 border border-orange-100 rounded-xl p-4">
          <p className="text-[11px] font-bold text-orange-700 mb-2.5 uppercase tracking-wider">
            What happens when you leave
          </p>
          <ul className="space-y-1.5">
            {[
              'You will be removed from the project team',
              'Your task assignments will be unassigned',
              'You will no longer receive project notifications',
              'An admin can re-invite you later if needed',
            ].map((item) => (
              <li key={item} className="flex items-start gap-2 text-xs text-orange-700">
                <span className="mt-[5px] w-1.5 h-1.5 rounded-full bg-orange-400 shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="px-5 sm:px-6 pb-5 sm:pb-6 flex gap-3">
          <button
            onClick={onClose}
            disabled={isLeaving}
            className="flex-1 h-10 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isLeaving}
            className="flex-1 h-10 bg-orange-500 text-white rounded-xl text-sm font-semibold hover:bg-orange-600 active:bg-orange-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLeaving ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Leaving…
              </>
            ) : (
              <>
                <LogOut size={14} />
                Leave Project
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Type change warning modal ──────────────────────────────────────────────────

function TypeChangeModal({
  open,
  currentType,
  newType,
  onClose,
  onConfirm,
  isChanging,
}: {
  open: boolean;
  currentType: ProjectType;
  newType: ProjectType;
  onClose: () => void;
  onConfirm: () => void;
  isChanging: boolean;
}) {
  if (!open) return null;

  const fromAgile = currentType === 'AGILE';
  const warnings = fromAgile
    ? [
        'Sprint history is preserved but not visible in Kanban mode',
        'Burndown charts and velocity tracking will be unavailable',
        'Active sprints will remain but cannot be managed',
      ]
    : [
        'Your board will be restructured for sprint-based workflow',
        'You can now create sprints and plan agile iterations',
        'Burndown charts and velocity tracking become available',
      ];

  return (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={!isChanging ? onClose : undefined}
      />
      <div className="relative bg-white w-full sm:rounded-2xl sm:max-w-md shadow-2xl border-0 sm:border sm:border-slate-200 rounded-t-2xl overflow-hidden animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200">
        <div className="px-5 sm:px-6 pt-5 sm:pt-6 pb-4">
          <div className="flex items-start gap-4">
            <div className="w-11 h-11 rounded-full bg-amber-50 ring-4 ring-amber-50 flex items-center justify-center shrink-0">
              <AlertTriangle size={22} className="text-amber-500" />
            </div>
            <div className="flex-1 pt-0.5">
              <h3 className="text-base font-bold text-slate-900">Change Project Type</h3>
              <p className="text-sm text-slate-500 mt-0.5">
                Switching from{' '}
                <span className="font-semibold text-slate-700">{currentType}</span> to{' '}
                <span className="font-semibold text-slate-700">{newType}</span>
              </p>
            </div>
            {!isChanging && (
              <button
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        <div className="mx-5 sm:mx-6 mb-4 bg-amber-50 border border-amber-100 rounded-xl p-4">
          <p className="text-[11px] font-bold text-amber-700 mb-2.5 uppercase tracking-wider">
            Things to be aware of
          </p>
          <ul className="space-y-1.5">
            {warnings.map((item) => (
              <li key={item} className="flex items-start gap-2 text-xs text-amber-800">
                <span className="mt-[5px] w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="px-5 sm:px-6 pb-5 sm:pb-6 flex gap-3">
          <button
            onClick={onClose}
            disabled={isChanging}
            className="flex-1 h-10 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isChanging}
            className="flex-1 h-10 bg-amber-500 text-white rounded-xl text-sm font-semibold hover:bg-amber-600 active:bg-amber-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isChanging && <Loader2 size={14} className="animate-spin" />}
            {isChanging ? 'Changing…' : 'Confirm Change'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────

export default function ProjectSettingsPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = Number(params.id);

  const [project, setProject] = useState<ProjectData | null>(null);
  const [loading, setLoading] = useState(true);

  // General form
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isSavingGeneral, setIsSavingGeneral] = useState(false);
  const [generalSaved, setGeneralSaved] = useState(false);

  // Type selector
  const [selectedType, setSelectedType] = useState<ProjectType>('KANBAN');
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [isChangingType, setIsChangingType] = useState(false);

  // Delete
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Leave
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  const currentUserId = getUserIdFromToken();
  const isOwner = project !== null && currentUserId !== null && project.ownerId === currentUserId;

  const isDirtyGeneral =
    project !== null &&
    (name.trim() !== project.name || description.trim() !== project.description);
  const isTypeDirty = project !== null && selectedType !== project.type;

  const fetchProject = useCallback(async () => {
    if (isNaN(projectId)) return;
    setLoading(true);
    try {
      const data = await projectsApi.fetchProjectDetails(String(projectId));
      const pd: ProjectData = {
        id: data.id,
        name: data.name,
        description: typeof data.description === 'string' ? data.description : '',
        projectKey: data.projectKey,
        type: (data.type as ProjectType | undefined) ?? 'KANBAN',
        teamId: typeof data.teamId === 'number' ? data.teamId : undefined,
        teamName: data.teamName,
        ownerId: typeof data.ownerId === 'number' ? data.ownerId : undefined,
        ownerName: typeof data.ownerName === 'string' ? data.ownerName : undefined,
        createdAt: typeof data.createdAt === 'string' ? data.createdAt : undefined,
      };
      setProject(pd);
      setName(pd.name);
      setDescription(pd.description);
      setSelectedType(pd.type);
    } catch {
      toast('Failed to load project details', 'error');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => { void fetchProject(); }, [fetchProject]);

  const handleSaveGeneral = async () => {
    if (!project || !isDirtyGeneral) return;
    setIsSavingGeneral(true);
    try {
      await projectsApi.updateProjectDetails(projectId, {
        name: name.trim(),
        description: description.trim(),
      });
      setProject((prev) =>
        prev ? { ...prev, name: name.trim(), description: description.trim() } : null
      );
      setScopedProjectValue('currentProjectName', name.trim());
      window.dispatchEvent(new Event('storage'));
      setGeneralSaved(true);
      setTimeout(() => setGeneralSaved(false), 3000);
      toast('Project updated successfully', 'success');
    } catch {
      toast('Failed to update project', 'error');
    } finally {
      setIsSavingGeneral(false);
    }
  };

  const handleChangeType = async () => {
    if (!project || !isTypeDirty) return;
    setIsChangingType(true);
    try {
      await projectsApi.updateProjectDetails(projectId, { type: selectedType });
      setProject((prev) => (prev ? { ...prev, type: selectedType } : null));
      setScopedProjectValue('currentProjectType', selectedType);
      window.dispatchEvent(new Event('storage'));
      setShowTypeModal(false);
      toast('Project type updated', 'success');
    } catch {
      toast('Failed to change project type', 'error');
    } finally {
      setIsChangingType(false);
    }
  };

  const handleDeleteProject = async () => {
    if (!project) return;
    if (!project.teamId) {
      toast('Cannot delete: team information is missing', 'error');
      setShowDeleteModal(false);
      return;
    }
    setIsDeleting(true);
    try {
      await projectsApi.deleteProject(projectId, project.teamId);
      removeScopedProjectValue('currentProjectId');
      removeScopedProjectValue('currentProjectName');
      removeScopedProjectValue('currentProjectType');
      window.dispatchEvent(new Event('storage'));
      toast('Project deleted successfully', 'success');
      router.push('/spaces');
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Failed to delete project. Please try again.';
      toast(msg, 'error');
      setIsDeleting(false);
    }
  };

  const handleLeaveProject = async () => {
    setIsLeaving(true);
    try {
      await projectsApi.leaveProject(projectId);
      removeScopedProjectValue('currentProjectId');
      removeScopedProjectValue('currentProjectName');
      removeScopedProjectValue('currentProjectType');
      window.dispatchEvent(new Event('storage'));
      toast('You have left the project', 'success');
      router.push('/spaces');
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Failed to leave project. Please try again.';
      toast(msg, 'error');
      setIsLeaving(false);
    }
  };

  if (isNaN(projectId)) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-sm text-red-500">Invalid project ID.</p>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-full bg-slate-50/70">

{/* ── Loading ───────────────────────────────────────────────── */}
        {loading && (
          <div className="flex flex-col items-center gap-3 py-20">
            <Loader2 size={26} className="animate-spin text-slate-300" />
            <p className="text-sm text-slate-400">Loading settings…</p>
          </div>
        )}

        {/* ── Content grid ──────────────────────────────────────────── */}
        {!loading && (
          <div className="px-6 py-6 pb-20">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 items-start">

              {/* ── Left column (3/5) ── General + Project Type ──── */}
              <div className="lg:col-span-3 space-y-5">

                {/* General */}
                <SectionCard
                  title="General"
                  description="Project name and description"
                  icon={<FileText size={15} />}
                >
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                        Project Name
                      </label>
                      <input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Enter project name"
                        className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                        Description
                        <span className="ml-1.5 font-normal text-slate-400">(optional)</span>
                      </label>
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Describe what this project is about…"
                        rows={4}
                        className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all bg-white resize-none"
                      />
                    </div>
                    <div className="flex items-center justify-between pt-1">
                      <div className="h-5">
                        {generalSaved && (
                          <span className="flex items-center gap-1.5 text-xs text-emerald-600">
                            <CheckCircle2 size={13} />
                            Changes saved
                          </span>
                        )}
                      </div>
                      <button
                        onClick={handleSaveGeneral}
                        disabled={!isDirtyGeneral || isSavingGeneral}
                        className="h-9 px-5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 active:bg-blue-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm shadow-blue-100"
                      >
                        {isSavingGeneral && <Loader2 size={13} className="animate-spin" />}
                        {isSavingGeneral ? 'Saving…' : 'Save Changes'}
                      </button>
                    </div>
                  </div>
                </SectionCard>

                {/* Project Type */}
                <SectionCard
                  title="Project Type"
                  description="Choose how your team manages and tracks work"
                  icon={<Layers size={15} />}
                >
                  <div className="grid grid-cols-2 gap-3">
                    {/* AGILE */}
                    <button
                      type="button"
                      onClick={() => setSelectedType('AGILE')}
                      className={`p-4 rounded-xl border-2 text-left transition-all duration-200 ${
                        selectedType === 'AGILE'
                          ? 'border-blue-500 bg-blue-50/70 shadow-sm'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${selectedType === 'AGILE' ? 'border-blue-500 bg-blue-500' : 'border-slate-300'}`}>
                            {selectedType === 'AGILE' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                          </div>
                          <span className="text-sm font-bold text-slate-900">Agile</span>
                        </div>
                        {project?.type === 'AGILE' && (
                          <span className="text-[10px] font-bold text-blue-600 bg-blue-50 border border-blue-100 px-1.5 py-0.5 rounded-full">Current</span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        Sprint-based workflow with backlog management, burndown charts, and velocity tracking.
                      </p>
                    </button>

                    {/* KANBAN */}
                    <button
                      type="button"
                      onClick={() => setSelectedType('KANBAN')}
                      className={`p-4 rounded-xl border-2 text-left transition-all duration-200 ${
                        selectedType === 'KANBAN'
                          ? 'border-blue-500 bg-blue-50/70 shadow-sm'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${selectedType === 'KANBAN' ? 'border-blue-500 bg-blue-500' : 'border-slate-300'}`}>
                            {selectedType === 'KANBAN' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                          </div>
                          <span className="text-sm font-bold text-slate-900">Kanban</span>
                        </div>
                        {project?.type === 'KANBAN' && (
                          <span className="text-[10px] font-bold text-blue-600 bg-blue-50 border border-blue-100 px-1.5 py-0.5 rounded-full">Current</span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        Continuous flow with a visual board, column management, and WIP limit support.
                      </p>
                    </button>
                  </div>

                  {isTypeDirty && (
                    <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center gap-3">
                      <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 flex-1">
                        <AlertTriangle size={13} className="shrink-0" />
                        <span>Changing project type may affect existing workflow data</span>
                      </div>
                      <button
                        onClick={() => setShowTypeModal(true)}
                        className="h-9 px-5 bg-amber-500 text-white text-sm font-semibold rounded-xl hover:bg-amber-600 active:bg-amber-700 transition-colors shrink-0 shadow-sm shadow-amber-100"
                      >
                        Apply Change
                      </button>
                    </div>
                  )}
                </SectionCard>

                <SectionCard
                  title="Custom Fields"
                  description="Add extra fields to all tasks in this project"
                  icon={<Settings2 size={15} />}
                >
                  <CustomFieldsManager projectId={projectId} />
                </SectionCard>

              </div>

              {/* ── Right column (2/5) ── Identity + Danger Zone ─── */}
              <div className="lg:col-span-2 space-y-5">

                {/* Project Identity */}
                {project && (
                  <SectionCard
                    title="Project Identity"
                    description="Read-only metadata"
                    icon={<Info size={15} />}
                  >
                    <div className="space-y-3">
                      {[
                        { label: 'Project Key', value: project.projectKey },
                        {
                          label: 'Created',
                          value: project.createdAt
                            ? new Date(project.createdAt).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                              })
                            : undefined,
                        },
                        { label: 'Team', value: project.teamName },
                        { label: 'Owner', value: project.ownerName },
                      ]
                        .filter((f) => f.value)
                        .map(({ label, value }) => (
                          <div key={label}>
                            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5">
                              {label}
                            </p>
                            <div className="h-9 px-3.5 border border-slate-100 rounded-xl bg-slate-50 flex items-center">
                              <span className="text-sm text-slate-700 font-medium truncate">{value}</span>
                            </div>
                          </div>
                        ))}
                    </div>
                  </SectionCard>
                )}

                {/* Danger Zone */}
                <div className="bg-white rounded-2xl border-2 border-red-100 overflow-hidden shadow-sm">
                  <div className="px-5 py-4 border-b border-red-100 bg-red-50/40">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-red-50 border border-red-100 flex items-center justify-center text-red-500 shrink-0">
                        <Shield size={15} />
                      </div>
                      <div>
                        <h2 className="text-sm font-semibold text-red-900">Danger Zone</h2>
                        <p className="text-xs text-red-500 mt-0.5">Irreversible actions</p>
                      </div>
                    </div>
                  </div>
                  <div className="px-5 py-5 space-y-4">
                    {/* Leave — visible to non-owners only */}
                    {!isOwner && (
                      <div>
                        <h3 className="text-sm font-semibold text-slate-900 mb-1">Leave this project</h3>
                        <p className="text-xs text-slate-500 leading-relaxed mb-3">
                          Remove yourself from the project team. Your task assignments will be cleared.
                        </p>
                        <button
                          onClick={() => setShowLeaveModal(true)}
                          className="w-full h-9 bg-white border-2 border-orange-200 text-orange-600 text-sm font-semibold rounded-xl hover:bg-orange-50 hover:border-orange-300 active:bg-orange-100 transition-all flex items-center justify-center gap-2"
                        >
                          <LogOut size={14} />
                          Leave Project
                        </button>
                      </div>
                    )}

                    {/* Delete — visible to owners only */}
                    {isOwner && (
                      <div>
                        <h3 className="text-sm font-semibold text-slate-900 mb-1">Delete this project</h3>
                        <p className="text-xs text-slate-500 leading-relaxed mb-3">
                          Permanently removes all tasks, members, and sprints. This cannot be reversed.
                        </p>
                        <button
                          onClick={() => setShowDeleteModal(true)}
                          className="w-full h-9 bg-white border-2 border-red-200 text-red-600 text-sm font-semibold rounded-xl hover:bg-red-50 hover:border-red-300 active:bg-red-100 transition-all flex items-center justify-center gap-2"
                        >
                          <Trash2 size={14} />
                          Delete Project
                        </button>
                      </div>
                    )}
                  </div>
                </div>

              </div>
            </div>
          </div>
        )}
      </div>

      {/* Portals */}
      {project && (
        <>
          <DeleteConfirmModal
            open={showDeleteModal}
            projectName={project.name}
            onClose={() => !isDeleting && setShowDeleteModal(false)}
            onConfirm={handleDeleteProject}
            isDeleting={isDeleting}
          />
          <LeaveConfirmModal
            open={showLeaveModal}
            projectName={project.name}
            onClose={() => !isLeaving && setShowLeaveModal(false)}
            onConfirm={handleLeaveProject}
            isLeaving={isLeaving}
          />
          <TypeChangeModal
            open={showTypeModal}
            currentType={project.type}
            newType={selectedType}
            onClose={() => !isChangingType && setShowTypeModal(false)}
            onConfirm={handleChangeType}
            isChanging={isChangingType}
          />
        </>
      )}
    </>
  );
}
