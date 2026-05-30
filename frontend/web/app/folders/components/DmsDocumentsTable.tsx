'use client';

import { DocumentItem } from '@/lib/dms';
import { Download, Eye, FileClock, FileText, Info, Pencil, RotateCcw, Star, Trash2 } from 'lucide-react';
import { formatBytes, timeAgo } from '@/app/folders/components/dmsUtils';
import { ViewMode } from '@/app/folders/components/types';

interface DmsDocumentsTableProps {
    filteredDocuments: DocumentItem[];
    favoriteIds: number[];
    isTrashMode: boolean;
    mode: ViewMode;
    loading?: boolean;
    onToggleFavorite: (documentId: number) => void;
    onView: (documentId: number) => void;
    onDownload: (documentId: number) => void;
    onRename: (document: DocumentItem) => void;
    onSoftDelete: (documentId: number) => void;
    onToggleVersions: (documentId: number) => void;
    onOpenInfo: (document: DocumentItem) => void;
    onRestore: (documentId: number) => void;
    onPermanentDelete: (documentId: number) => void;
}

export default function DmsDocumentsTable({
    filteredDocuments,
    favoriteIds,
    isTrashMode,
    mode,
    loading = false,
    onToggleFavorite,
    onView,
    onDownload,
    onRename,
    onSoftDelete,
    onToggleVersions,
    onOpenInfo,
    onRestore,
    onPermanentDelete,
}: DmsDocumentsTableProps) {
    return (
        <div className="overflow-x-auto">
            <table className="w-full min-w-[720px]">
                <thead>
                    <tr className="text-left text-xs uppercase tracking-[0.08em] text-cu-text-secondary border-b border-cu-border bg-cu-bg-secondary">
                        <th className="px-5 py-3 font-semibold">Name</th>
                        {mode === 'recent' && <th className="px-5 py-3 font-semibold">Last Modified</th>}
                        <th className="px-5 py-3 font-semibold">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {loading && filteredDocuments.length === 0 && (
                        Array.from({ length: 3 }).map((_, i) => (
                            <tr key={`skeleton-${i}`} className="border-b border-cu-border-light animate-pulse">
                                <td className="px-5 py-4">
                                    <div className="flex items-start gap-3">
                                        <div className="mt-0.5 w-4 h-4 rounded bg-cu-bg-tertiary" />
                                        <div className="space-y-2">
                                            <div className="h-3.5 w-40 rounded bg-cu-bg-tertiary" />
                                            <div className="h-2.5 w-24 rounded bg-cu-bg-tertiary" />
                                        </div>
                                    </div>
                                </td>
                                {mode === 'recent' && <td className="px-5 py-4"><div className="h-3 w-16 rounded bg-cu-bg-tertiary" /></td>}
                                <td className="px-5 py-4"><div className="h-8 w-32 rounded bg-cu-bg-tertiary" /></td>
                            </tr>
                        ))
                    )}

                    {!loading && filteredDocuments.length === 0 && (
                        <tr>
                            <td className="px-5 py-12 text-center" colSpan={mode === 'recent' ? 3 : 2}>
                                <FileText size={32} className="mx-auto text-cu-text-muted mb-3" />
                                <p className="text-sm font-medium text-cu-text-primary">
                                    {isTrashMode ? 'Trash is empty' : 'No documents yet'}
                                </p>
                                <p className="text-xs text-cu-text-tertiary mt-1">
                                    {isTrashMode ? 'Deleted documents will appear here.' : 'Upload a file to get started.'}
                                </p>
                            </td>
                        </tr>
                    )}

                    {filteredDocuments.map((doc) => {
                        const isFavorite = favoriteIds.includes(doc.id);

                        return (
                            <tr key={doc.id} className="border-b border-cu-border-light hover:bg-cu-hover align-top">
                                <td className="px-5 py-4">
                                    <div className="flex items-start gap-3">
                                        <div className="mt-0.5 text-cu-text-secondary"><FileText size={16} /></div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <p className="text-sm font-medium text-cu-text-primary">{doc.name}</p>
                                                <button
                                                    onClick={() => onToggleFavorite(doc.id)}
                                                    className="text-cu-text-tertiary hover:text-cu-warning"
                                                    title="Toggle favorite"
                                                >
                                                    <Star
                                                        size={14}
                                                        fill={isFavorite ? 'var(--cu-warning)' : 'none'}
                                                        color={isFavorite ? 'var(--cu-warning)' : 'currentColor'}
                                                    />
                                                </button>
                                            </div>
                                            <p className="text-xs text-cu-text-secondary mt-1">{doc.contentType} • {doc.humanReadableSize ?? formatBytes(doc.fileSize)} • v{doc.latestVersionNumber}</p>
                                        </div>
                                    </div>
                                </td>
                                {mode === 'recent' && (
                                    <td className="px-5 py-4 text-xs text-cu-text-secondary whitespace-nowrap">
                                        {timeAgo(doc.updatedAt)}
                                    </td>
                                )}
                                <td className="px-5 py-4">
                                    <div className="flex flex-wrap items-center gap-2">
                                        {!isTrashMode && (
                                            <>
                                                <button onClick={() => onView(doc.id)} className="h-8 w-8 inline-flex items-center justify-center border border-cu-border rounded-md hover:bg-cu-hover text-cu-text-secondary" title="View">
                                                    <Eye size={14} />
                                                </button>
                                                <button onClick={() => onDownload(doc.id)} className="h-8 w-8 inline-flex items-center justify-center border border-cu-border rounded-md hover:bg-cu-hover text-cu-text-secondary" title="Download">
                                                    <Download size={14} />
                                                </button>
                                                <button onClick={() => onRename(doc)} className="h-8 w-8 inline-flex items-center justify-center border border-cu-border rounded-md hover:bg-cu-hover text-cu-text-secondary" title="Rename">
                                                    <Pencil size={14} />
                                                </button>
                                                <button onClick={() => onSoftDelete(doc.id)} className="h-8 w-8 inline-flex items-center justify-center border border-cu-danger/30 text-cu-danger rounded-md hover:bg-cu-danger-light" title="Soft delete">
                                                    <Trash2 size={14} />
                                                </button>
                                                <button onClick={() => onToggleVersions(doc.id)} className="h-8 w-8 inline-flex items-center justify-center border border-cu-border rounded-md hover:bg-cu-hover text-cu-text-secondary" title="Version history">
                                                    <FileClock size={14} />
                                                </button>
                                                <button onClick={() => onOpenInfo(doc)} className="h-8 w-8 inline-flex items-center justify-center border border-cu-border rounded-md hover:bg-cu-hover text-cu-text-secondary" title="Info">
                                                    <Info size={14} />
                                                </button>
                                            </>
                                        )}

                                        {isTrashMode && (
                                            <>
                                                <button onClick={() => onRestore(doc.id)} className="px-2.5 py-1.5 text-xs border border-cu-border rounded-md hover:bg-cu-hover text-cu-text-secondary inline-flex items-center gap-1" title="Restore">
                                                    <RotateCcw size={12} />
                                                    Restore
                                                </button>
                                                <button onClick={() => onPermanentDelete(doc.id)} className="px-2.5 py-1.5 text-xs border border-cu-danger/50 text-cu-danger rounded-md hover:bg-cu-danger-light inline-flex items-center gap-1" title="Permanent delete">
                                                    <Trash2 size={12} />
                                                    Permanent delete
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}
