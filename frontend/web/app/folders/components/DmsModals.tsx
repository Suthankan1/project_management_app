'use client';

import { DocumentItem, DocumentVersionItem } from '@/lib/dms';
import { Info, Pencil, Users, X } from 'lucide-react';
import { formatBytes, toDateLabel } from '@/app/folders/components/dmsUtils';

interface DmsModalsProps {
    selectedVersionsDocId: number | null;
    selectedVersionsDoc: DocumentItem | null;
    versions: Record<number, DocumentVersionItem[]>;
    setSelectedVersionsDocId: (value: number | null) => void;
    selectedInfoDoc: DocumentItem | null;
    setSelectedInfoDoc: (value: DocumentItem | null) => void;
    getFolderName: (folderId: number | null) => string;
    isUploading?: boolean;
    uploadProgress?: number;
    renameDoc: DocumentItem | null;
    renameName: string;
    setRenameName: (value: string) => void;
    onConfirmRename: () => Promise<void>;
    onCancelRename: () => void;
    busy?: boolean;
}

export default function DmsModals({
    selectedVersionsDocId,
    selectedVersionsDoc,
    versions,
    setSelectedVersionsDocId,
    selectedInfoDoc,
    setSelectedInfoDoc,
    getFolderName,
    isUploading = false,
    uploadProgress = 0,
    renameDoc,
    renameName,
    setRenameName,
    onConfirmRename,
    onCancelRename,
    busy = false,
}: DmsModalsProps) {
    if (selectedVersionsDocId === null && selectedInfoDoc === null && !isUploading && renameDoc === null) {
        return null;
    }

    return (
        <>
            {renameDoc !== null && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/25 backdrop-blur-sm p-4">
                    <div className="w-full max-w-md rounded-xl border border-cu-border bg-cu-bg shadow-2xl">
                        <div className="flex items-center justify-between border-b border-cu-border px-5 py-4">
                            <div className="inline-flex items-center gap-2 text-cu-text-primary">
                                <Pencil size={16} />
                                <h3 className="text-sm font-semibold">Rename document</h3>
                            </div>
                            <button
                                onClick={onCancelRename}
                                className="h-8 w-8 inline-flex items-center justify-center rounded-md border border-cu-border text-cu-text-secondary hover:bg-cu-hover"
                                title="Close"
                            >
                                <X size={14} />
                            </button>
                        </div>
                        <div className="px-5 py-4 space-y-4">
                            <div>
                                <label className="text-xs font-medium text-cu-text-primary mb-1.5 block">
                                    Document name
                                </label>
                                <input
                                    value={renameName}
                                    onChange={(e) => setRenameName(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') void onConfirmRename();
                                        if (e.key === 'Escape') onCancelRename();
                                    }}
                                    className="w-full px-3 py-2 text-sm bg-cu-bg text-cu-text-primary border border-cu-border rounded-md focus:outline-none focus:ring-2 focus:ring-cu-primary/25"
                                    autoFocus
                                />
                            </div>
                            <div className="flex items-center justify-end gap-2">
                                <button
                                    onClick={onCancelRename}
                                    className="px-4 py-2 text-sm border border-cu-border text-cu-text-secondary rounded-md hover:bg-cu-hover"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => void onConfirmRename()}
                                    disabled={busy || !renameName.trim() || renameName.trim() === renameDoc.name}
                                    className="px-4 py-2 text-sm bg-cu-primary text-white rounded-md hover:bg-cu-primary-hover disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Rename
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {isUploading && (
                <div className="fixed bottom-8 right-8 z-50 w-72 rounded-xl border border-cu-border bg-cu-bg p-4 shadow-2xl">
                    <p className="text-sm font-medium text-cu-text-primary mb-2">Uploading...</p>
                    <div className="w-full bg-cu-bg-tertiary rounded-full h-2">
                        <div
                            style={{ width: `${uploadProgress}%` }}
                            className="h-2 rounded-full bg-cu-primary transition-all duration-200"
                        />
                    </div>
                    <p className="text-xs text-cu-text-secondary mt-1">{uploadProgress}%</p>
                </div>
            )}

            {(selectedVersionsDocId !== null || selectedInfoDoc !== null) && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/25 backdrop-blur-sm p-4">
                    {selectedVersionsDocId !== null && selectedVersionsDoc && (
                        <div className="w-full max-w-2xl rounded-xl border border-cu-border bg-cu-bg shadow-2xl">
                            <div className="flex items-center justify-between border-b border-cu-border px-5 py-4">
                                <div className="inline-flex items-center gap-2 text-cu-text-primary">
                                    <Users size={16} />
                                    <h3 className="text-sm font-semibold">Version history</h3>
                                </div>
                                <button
                                    onClick={() => setSelectedVersionsDocId(null)}
                                    className="h-8 w-8 inline-flex items-center justify-center rounded-md border border-cu-border text-cu-text-secondary hover:bg-cu-hover"
                                    title="Close"
                                >
                                    <X size={14} />
                                </button>
                            </div>
                            <div className="px-5 py-4">
                                <p className="text-sm font-medium text-cu-text-primary mb-3 truncate">{selectedVersionsDoc.name}</p>
                                <div className="max-h-[360px] overflow-y-auto space-y-2">
                                    {(versions[selectedVersionsDocId] || []).map((version) => (
                                        <div key={version.id} className="text-xs text-cu-text-secondary flex items-center justify-between rounded-md border border-cu-border bg-cu-bg-secondary px-3 py-2">
                                            <span>
                                                v{version.versionNumber} • {formatBytes(version.fileSize)} • {version.contentType}
                                            </span>
                                            <span>
                                                {version.uploadedByName} • {toDateLabel(version.uploadedAt)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {selectedInfoDoc !== null && (
                        <div className="w-full max-w-md rounded-xl border border-cu-border bg-cu-bg shadow-2xl">
                            <div className="flex items-center justify-between border-b border-cu-border px-5 py-4">
                                <div className="inline-flex items-center gap-2 text-cu-text-primary">
                                    <Info size={16} />
                                    <h3 className="text-sm font-semibold">Document info</h3>
                                </div>
                                <button
                                    onClick={() => setSelectedInfoDoc(null)}
                                    className="h-8 w-8 inline-flex items-center justify-center rounded-md border border-cu-border text-cu-text-secondary hover:bg-cu-hover"
                                    title="Close"
                                >
                                    <X size={14} />
                                </button>
                            </div>
                            <div className="px-5 py-4 space-y-3 text-sm text-cu-text-primary">
                                <p><span className="font-medium">Name:</span> {selectedInfoDoc.name}</p>
                                <p><span className="font-medium">Owner:</span> {selectedInfoDoc.uploadedByName}</p>
                                <p><span className="font-medium">Folder:</span> {selectedInfoDoc.folderName ?? getFolderName(selectedInfoDoc.folderId)}</p>
                                <p><span className="font-medium">Updated:</span> {toDateLabel(selectedInfoDoc.updatedAt || selectedInfoDoc.createdAt)}</p>
                                <p><span className="font-medium">Size:</span> {selectedInfoDoc.humanReadableSize ?? formatBytes(selectedInfoDoc.fileSize)}</p>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </>
    );
}
