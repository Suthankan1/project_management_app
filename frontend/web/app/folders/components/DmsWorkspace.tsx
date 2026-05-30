'use client';

import { useRef, useState } from 'react';
import { Loader2, RefreshCw, Search, X } from 'lucide-react';
import DmsHeader from '@/app/folders/components/DmsHeader';
import DmsSidebar from '@/app/folders/components/DmsSidebar';
import DmsDocumentsTable from '@/app/folders/components/DmsDocumentsTable';
import DmsModals from '@/app/folders/components/DmsModals';
import { ViewMode } from '@/app/folders/components/types';
import { useDmsWorkspace } from '@/app/folders/hooks/useDmsWorkspace';
import EmptyState from '@/components/shared/EmptyState';

interface DmsWorkspaceProps {
    mode: ViewMode;
}

export default function DmsWorkspace({ mode }: DmsWorkspaceProps) {
    const {
        loading, error, projectId, currentProjectName, isTrashMode, title, busy,
        folders, selectedFolderId, setSelectedFolderId,
        newFolderName, setNewFolderName, folderCount,
        filteredDocuments, favoriteIds,
        searchQuery, setSearchQuery,
        selectedVersionsDocId, setSelectedVersionsDocId,
        selectedVersionsDoc, selectedInfoDoc, setSelectedInfoDoc,
        renameDoc, renameName, setRenameName,
        versions, isUploading, uploadProgress,
        withProjectId, getFolderName,
        onCreateFolder, onDeleteFolder, onUpload, onDrop,
        onToggleFavorite, onView, onDownload, onRename, onConfirmRename, onCancelRename,
        onSoftDelete, onToggleVersions, onOpenInfo, onRestore, onPermanentDelete,
        refresh,
        quota, selectedPermsFolder, folderPermissions, loadingPerms, savingPerms,
        onOpenFolderPermissions, onSaveFolderPermissions, onCloseFolderPermissions,
        previewDoc, setPreviewDoc,
    } = useDmsWorkspace(mode);

    const dragCounter = useRef(0);
    const [isDragOver, setIsDragOver] = useState(false);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full bg-cu-bg-secondary">
                <Loader2 className="h-6 w-6 animate-spin text-cu-primary" />
            </div>
        );
    }

    if (!projectId) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] gap-3 text-center px-4">
                <EmptyState
                    title="No project selected"
                    subtitle="Open a project first, then navigate to Documents. Folders and files always belong to a specific project."
                    action={
                        <a
                            href="/dashboard"
                            className="inline-flex items-center gap-2 rounded-xl bg-cu-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-cu-primary-hover transition-colors"
                        >
                            Open dashboard
                        </a>
                    }
                />
            </div>
        );
    }

    return (
        <>
            <div
                className="w-full max-w-[1400px] mx-auto min-h-[calc(100vh-160px)] rounded-xl border border-cu-border bg-cu-bg-secondary shadow-sm overflow-hidden relative"
                onDragEnter={(e) => {
                    e.preventDefault();
                    dragCounter.current++;
                    if (dragCounter.current === 1) setIsDragOver(true);
                }}
                onDragLeave={() => {
                    dragCounter.current--;
                    if (dragCounter.current === 0) setIsDragOver(false);
                }}
                onDragOver={(e) => { e.preventDefault(); }} // keep for drop permission
                onDrop={(e) => {
                    e.preventDefault();
                    dragCounter.current = 0;
                    setIsDragOver(false);
                    onDrop(e);
                }}
            >
                {/* pointer-events-none on the overlay so underlying drag events still fire on the container */}
                {isDragOver && (
                    <div className="absolute inset-0 z-30 flex items-center justify-center bg-cu-primary-light/80 border-2 border-dashed border-cu-primary rounded-xl pointer-events-none">
                        <p className="text-lg font-semibold text-cu-primary">Drop file to upload</p>
                    </div>
                )}

                <DmsHeader title={title} isTrashMode={isTrashMode} onUpload={onUpload} />

                <div className="grid grid-cols-12 min-h-[70vh]">
                    <DmsSidebar
                        mode={mode} isTrashMode={isTrashMode} projectId={projectId}
                        projectName={currentProjectName}
                        folders={folders} selectedFolderId={selectedFolderId}
                        setSelectedFolderId={setSelectedFolderId}
                        onDeleteFolder={onDeleteFolder} newFolderName={newFolderName}
                        setNewFolderName={setNewFolderName} onCreateFolder={onCreateFolder}
                        busy={busy} folderCount={folderCount}
                        filteredDocumentCount={filteredDocuments.length}
                        withProjectId={withProjectId}
                        quota={quota}
                        onOpenFolderPermissions={onOpenFolderPermissions}
                    />

                    <section className="col-span-12 lg:col-span-9 xl:col-span-10 bg-cu-bg">
                        <div className="px-5 py-3 border-b border-cu-border flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                            <div className="relative w-full lg:max-w-[420px]">
                                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-cu-text-tertiary" />
                                <input
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search by name, owner, or type"
                                    className={`w-full pl-9 ${searchQuery ? 'pr-8' : 'pr-3'} py-2 text-sm bg-cu-bg text-cu-text-primary border border-cu-border rounded-md focus:outline-none focus:ring-2 focus:ring-cu-primary/25`}
                                />
                                {searchQuery && (
                                    <button
                                        onClick={() => setSearchQuery('')}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 text-cu-text-tertiary hover:text-cu-text-primary"
                                        title="Clear search"
                                    >
                                        <X size={14} />
                                    </button>
                                )}
                            </div>
                            <div className="inline-flex rounded-md border border-cu-border overflow-hidden text-xs">
                                <span className="px-3 py-2 bg-cu-bg-secondary text-cu-text-secondary">Mode</span>
                                <span className="px-3 py-2 bg-cu-bg text-cu-text-primary font-semibold">{title}</span>
                            </div>
                        </div>

                        {error && (
                            <div className="mx-5 mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700 flex items-center justify-between gap-3 flex-wrap">
                                <span>{error}</span>
                                <button
                                    type="button"
                                    onClick={() => void refresh()}
                                    className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-red-700 border border-red-200 hover:bg-red-100 transition-colors"
                                >
                                    <RefreshCw size={13} />
                                    Retry
                                </button>
                            </div>
                        )}
                        {filteredDocuments.length === 0 ? (
                            <div className="px-6 py-10">
                                <EmptyState
                                    title={searchQuery.trim() ? 'No documents match your search' : 'No documents yet'}
                                    subtitle={searchQuery.trim() ? 'Clear the search to see all files.' : 'Upload a file or create a folder from the header to get started.'}
                                    action={
                                        <button
                                            type="button"
                                            onClick={() => void refresh()}
                                            className="inline-flex items-center gap-2 rounded-xl bg-cu-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-cu-primary-hover transition-colors"
                                        >
                                            <RefreshCw size={14} />
                                            Refresh
                                        </button>
                                    }
                                />
                            </div>
                        ) : (
                            <DmsDocumentsTable
                                filteredDocuments={filteredDocuments} favoriteIds={favoriteIds}
                                isTrashMode={isTrashMode} mode={mode}
                                onToggleFavorite={onToggleFavorite} onView={onView} onDownload={onDownload}
                                onRename={onRename} onSoftDelete={onSoftDelete}
                                onToggleVersions={onToggleVersions} onOpenInfo={onOpenInfo}
                                onRestore={onRestore} onPermanentDelete={onPermanentDelete}
                            />
                        )}
                    </section>
                </div>
            </div>

            <DmsModals
                selectedVersionsDocId={selectedVersionsDocId} selectedVersionsDoc={selectedVersionsDoc}
                versions={versions} setSelectedVersionsDocId={setSelectedVersionsDocId}
                selectedInfoDoc={selectedInfoDoc} setSelectedInfoDoc={setSelectedInfoDoc}
                getFolderName={getFolderName} isUploading={isUploading} uploadProgress={uploadProgress}
                renameDoc={renameDoc} renameName={renameName} setRenameName={setRenameName}
                onConfirmRename={onConfirmRename} onCancelRename={onCancelRename} busy={busy}
                selectedPermsFolder={selectedPermsFolder} folderPermissions={folderPermissions}
                loadingPerms={loadingPerms} savingPerms={savingPerms}
                onSaveFolderPermissions={onSaveFolderPermissions} onCloseFolderPermissions={onCloseFolderPermissions}
                projectId={projectId}
                previewDoc={previewDoc} setPreviewDoc={setPreviewDoc}
            />
        </>
    );
}
