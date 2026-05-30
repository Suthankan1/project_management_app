'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
    createFolder,
    deleteFolder,
    DocumentFolder,
    DocumentItem,
    DocumentVersionItem,
    getDocumentDownloadUrl,
    getDocumentVersions,
    listDocuments,
    listFolders,
    listUserProjects,
    permanentDeleteDocument,
    restoreDocument,
    softDeleteDocument,
    updateDocumentMetadata,
    uploadDocument,
} from '@/lib/dms';
import { ViewMode } from '@/app/folders/components/types';

const FAVORITES_KEY = 'dmsFavoriteDocumentIds';

export function useDmsWorkspace(mode: ViewMode) {
    const searchParams = useSearchParams();
    const [projectId] = useState<number | null>(() => {
        const qp = searchParams.get('projectId');
        const stored = typeof window !== 'undefined' ? localStorage.getItem('currentProjectId') : null;
        const id = Number(qp || stored);
        return Number.isFinite(id) && id > 0 ? id : null;
    });
    const [folders, setFolders] = useState<DocumentFolder[]>([]);
    const [documents, setDocuments] = useState<DocumentItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedFolderId, setSelectedFolderId] = useState<number | undefined>(undefined);
    const [newFolderName, setNewFolderName] = useState('');
    const [selectedVersionsDocId, setSelectedVersionsDocId] = useState<number | null>(null);
    const [selectedInfoDoc, setSelectedInfoDoc] = useState<DocumentItem | null>(null);
    const [versions, setVersions] = useState<Record<number, DocumentVersionItem[]>>({});
    const [favoriteIds, setFavoriteIds] = useState<number[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isUploading, setIsUploading] = useState(false);
    const [isDragOver, setIsDragOver] = useState(false);
    const [currentProjectName, setCurrentProjectName] = useState<string | null>(null);
    const [renameDoc, setRenameDoc] = useState<DocumentItem | null>(null);
    const [renameName, setRenameName] = useState('');

    const isTrashMode = mode === 'trash';

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const raw = localStorage.getItem(FAVORITES_KEY);
        if (!raw) { setFavoriteIds([]); return; }
        try {
            const parsed = JSON.parse(raw) as number[];
            setFavoriteIds(Array.isArray(parsed) ? parsed : []);
        } catch { setFavoriteIds([]); }
    }, []);

    useEffect(() => {
        if (!projectId) { setLoading(false); return; }
        const load = async () => {
            try {
                setLoading(true); setError(null);
                const [folderData, documentData, allProjects] = await Promise.all([
                    listFolders(projectId),
                    listDocuments(projectId, undefined, isTrashMode),
                    listUserProjects(),
                ]);
                setFolders(folderData);
                setDocuments(documentData);
                const match = allProjects.find((p) => p.id === projectId);
                setCurrentProjectName(match?.name ?? null);
            } catch { setError('Failed to load folder and document data.'); }
            finally { setLoading(false); }
        };
        void load();
    }, [projectId, isTrashMode]);

    const filteredDocuments = useMemo(() => {
        let result = documents.filter((doc) => {
            if (isTrashMode && doc.status !== 'SOFT_DELETED') return false;
            if (!isTrashMode && doc.status !== 'ACTIVE') return false;
            if (selectedFolderId && doc.folderId !== selectedFolderId) return false;
            if (mode === 'favorites' && !favoriteIds.includes(doc.id)) return false;
            if (searchQuery.trim()) {
                const n = searchQuery.toLowerCase();
                if (!doc.name.toLowerCase().includes(n) &&
                    !doc.uploadedByName.toLowerCase().includes(n) &&
                    !doc.contentType.toLowerCase().includes(n)) return false;
            }
            return true;
        });
        if (mode === 'recent') {
            result = [...result]
                .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
                .slice(0, 20);
        }
        return result;
    }, [documents, favoriteIds, isTrashMode, mode, selectedFolderId, searchQuery]);

    const title = useMemo(() => {
        const map: Record<string, string> = { recent: 'Recent', favorites: 'Favorites', trash: 'Trash' };
        return map[mode] ?? 'All Documents';
    }, [mode]);

    const refresh = async () => {
        if (!projectId) return;
        try {
            setLoading(true);
            setError(null);
            const [folderData, documentData, allProjects] = await Promise.all([
                listFolders(projectId),
                listDocuments(projectId, undefined, isTrashMode),
                listUserProjects(),
            ]);
            setFolders(folderData);
            setDocuments(documentData);
            const match = allProjects.find((p) => p.id === projectId);
            setCurrentProjectName(match?.name ?? null);
        } catch {
            setError('Failed to load folder and document data.');
        } finally {
            setLoading(false);
        }
    };

    const withProjectId = (basePath: string) =>
        projectId ? `${basePath}?projectId=${projectId}` : basePath;

    const getFolderName = (folderId: number | null) =>
        folderId ? folders.find((f) => f.id === folderId)?.name ?? 'Root' : 'Root';

    const onCreateFolder = async () => {
        if (!projectId || !newFolderName.trim()) return;
        try {
            setBusy(true);
            const created = await createFolder(projectId, newFolderName.trim());
            setFolders((prev) => [...prev, created]);
            setNewFolderName('');
        } catch { setError('Failed to create folder.'); }
        finally { setBusy(false); }
    };

    const onDeleteFolder = async (folder: DocumentFolder) => {
        if (!projectId || isTrashMode) return;
        const activeCount = documents.filter((d) => d.folderId === folder.id && d.status === 'ACTIVE').length;
        const msg = activeCount > 0
            ? `Delete folder "${folder.name}"?\n\nThis folder contains ${activeCount} document(s). Deleting this folder will also move all documents inside it to Trash.`
            : `Are you sure you want to delete folder "${folder.name}"?`;
        if (!window.confirm(msg)) return;
        try {
            setBusy(true);
            await deleteFolder(projectId, folder.id);
            setFolders((prev) => prev.filter((f) => f.id !== folder.id));
            if (selectedFolderId === folder.id) setSelectedFolderId(undefined);
            await refresh();
        } catch { setError('Failed to delete folder. Ensure it has no documents or child folders.'); }
        finally { setBusy(false); }
    };

    const handleUploadFile = async (file: File) => {
        if (!projectId) return;
        try {
            setBusy(true); setIsUploading(true); setUploadProgress(0);
            await uploadDocument(projectId, file, selectedFolderId, (p) => setUploadProgress(p));
            await refresh();
        } catch (err) {
            const msg = (err as { message?: string })?.message;
            setError(msg?.trim() ? msg : 'Upload failed.');
        } finally { setBusy(false); setIsUploading(false); setUploadProgress(0); }
    };

    const onUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) { await handleUploadFile(file); event.target.value = ''; }
    };

    const onDrop = async (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        setIsDragOver(false);
        const file = event.dataTransfer.files?.[0];
        if (file) await handleUploadFile(file);
    };

    const onDownload = async (documentId: number) => {
        if (!projectId) return;
        try { window.open(await getDocumentDownloadUrl(projectId, documentId), '_blank', 'noopener,noreferrer'); }
        catch { setError('Failed to generate download URL.'); }
    };

    const onView = async (documentId: number) => {
        if (!projectId) return;
        try { window.open(await getDocumentDownloadUrl(projectId, documentId), '_blank', 'noopener,noreferrer'); }
        catch { setError('Failed to open document in browser.'); }
    };

    const onRename = (document: DocumentItem) => {
        setRenameDoc(document);
        setRenameName(document.name);
    };

    const onConfirmRename = async () => {
        if (!projectId || !renameDoc || !renameName.trim() || renameName.trim() === renameDoc.name) {
            setRenameDoc(null);
            setRenameName('');
            return;
        }
        try {
            setBusy(true);
            await updateDocumentMetadata(projectId, renameDoc.id, { name: renameName.trim() });
            await refresh();
        } catch { setError('Failed to rename document.'); }
        finally { setBusy(false); setRenameDoc(null); setRenameName(''); }
    };

    const onCancelRename = () => { setRenameDoc(null); setRenameName(''); };

    const onSoftDelete = async (documentId: number) => {
        if (!projectId) return;
        try { setBusy(true); await softDeleteDocument(projectId, documentId); await refresh(); }
        catch { setError('Failed to delete document. You may need Owner/Admin permission.'); }
        finally { setBusy(false); }
    };

    const onRestore = async (documentId: number) => {
        if (!projectId) return;
        try { setBusy(true); await restoreDocument(projectId, documentId); await refresh(); }
        catch { setError('Failed to restore document.'); }
        finally { setBusy(false); }
    };

    const onPermanentDelete = async (documentId: number) => {
        if (!projectId) return;
        if (!window.confirm('Permanently delete this document and all versions?')) return;
        try { setBusy(true); await permanentDeleteDocument(projectId, documentId); await refresh(); }
        catch { setError('Failed to permanently delete document.'); }
        finally { setBusy(false); }
    };

    const onToggleFavorite = (documentId: number) => {
        const next = favoriteIds.includes(documentId)
            ? favoriteIds.filter((id) => id !== documentId)
            : [...favoriteIds, documentId];
        setFavoriteIds(next);
        if (typeof window !== 'undefined') localStorage.setItem(FAVORITES_KEY, JSON.stringify(next));
    };

    const onToggleVersions = async (documentId: number) => {
        if (!projectId) return;
        if (selectedVersionsDocId === documentId) { setSelectedVersionsDocId(null); return; }
        setSelectedVersionsDocId(documentId);
        if (versions[documentId]) return;
        try {
            setVersions((prev) => ({ ...prev, [documentId]: [] }));
            const data = await getDocumentVersions(projectId, documentId);
            setVersions((prev) => ({ ...prev, [documentId]: data }));
        } catch { setError('Failed to load version history.'); }
    };

    const onOpenInfo = (document: DocumentItem) => setSelectedInfoDoc(document);

    const selectedVersionsDoc = selectedVersionsDocId
        ? filteredDocuments.find((d) => d.id === selectedVersionsDocId)
            ?? documents.find((d) => d.id === selectedVersionsDocId)
            ?? null
        : null;

    return {
        projectId, currentProjectName, folders, documents, loading, busy, error, isTrashMode,
        selectedFolderId, setSelectedFolderId,
        newFolderName, setNewFolderName,
        selectedVersionsDocId, setSelectedVersionsDocId, selectedVersionsDoc,
        selectedInfoDoc, setSelectedInfoDoc,
        renameDoc, renameName, setRenameName,
        versions, favoriteIds, searchQuery, setSearchQuery,
        filteredDocuments, title,
        folderCount: folders.length,
        withProjectId, getFolderName,
        onCreateFolder, onDeleteFolder, onUpload, onDrop,
        onDownload, onView, onRename, onConfirmRename, onCancelRename, onSoftDelete, onRestore,
        onPermanentDelete, onToggleFavorite, onToggleVersions, onOpenInfo,
        isDragOver, setIsDragOver, isUploading, uploadProgress, refresh,
    };
}
