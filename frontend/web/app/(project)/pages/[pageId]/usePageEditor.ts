'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { usePageContent } from './hooks/usePageContent';
import TurndownService from 'turndown';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

export function usePageEditor() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const pageId = params?.pageId as string;

  // Falls back to localStorage so projectId survives navigation events that strip query params
  const projectId = searchParams.get('projectId') || (typeof window !== 'undefined' ? localStorage.getItem('currentProjectId') : null);

  const {
    selectedPage, setSelectedPage,
    title, setTitle,
    loadingPage,
    historyMock, setHistoryMock,
    isDraft,
    filteredPages, error, searchQuery, setSearchQuery,
    updatePage, createPage, deletePage, refetch,
    toggleStar, movePage,
  } = usePageContent(pageId, projectId);

  // saveStatus starts as 'draft' for new pages, 'idle' otherwise
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error' | 'idle' | 'draft'>(
    () => (pageId === 'new' ? 'draft' : 'idle'),
  );
  const [localError, setLocalError] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [showDocSidebar, setShowDocSidebar] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Tracks the latest editor HTML without waiting for the 800ms debounce.
  // Used by handleManualCreate so Publish always captures what the user typed.
  const latestContentRef = useRef<string>('');
  const setLatestContent = useCallback((html: string) => {
    latestContentRef.current = html;
  }, []);

  const handleUpdateContent = useCallback(async (htmlContent: string) => {
    if (!selectedPage || !projectId) return;
    setSelectedPage(prev => prev ? { ...prev, content: htmlContent } : null);
    if (isDraft) { setSaveStatus('draft'); return; }

    setSaveStatus('saving');
    try {
      await updatePage(selectedPage.id, title, htmlContent);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
      setHistoryMock(prev => [{
        id: Math.random().toString(),
        pageId: selectedPage.id,
        action: 'edited',
        editedBy: 'You',
        editedAt: new Date().toISOString(),
      }, ...prev.slice(0, 9)]);
    } catch (err) {
      console.error('Error auto-saving:', err);
      setSaveStatus('error');
    }
  }, [selectedPage, title, projectId, updatePage, isDraft, setSelectedPage, setHistoryMock]);

  // Debounced title save
  useEffect(() => {
    if (!selectedPage || title === selectedPage.title || !projectId) return;
    if (isDraft) { setSelectedPage(prev => prev ? { ...prev, title } : null); return; }

    const timeoutId = setTimeout(async () => {
      setSaveStatus('saving');
      try {
        await updatePage(selectedPage.id, title, selectedPage.content || '');
        setSelectedPage(prev => prev ? { ...prev, title } : null);
        refetch();
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
      } catch (err) {
        console.error('Error auto-saving title:', err);
        setSaveStatus('error');
      }
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [title, selectedPage, projectId, updatePage, refetch, isDraft, setSelectedPage]);

  const handleManualCreate = async () => {
    if (!selectedPage || !projectId) return;
    setSaveStatus('saving');
    // Use latestContentRef to capture whatever is in the editor right now,
    // even if the 800ms debounce hasn't fired yet.
    const content = latestContentRef.current || selectedPage.content || '';
    try {
      const newPage = await createPage(title, content);
      setSaveStatus('saved');
      // replace() instead of push() so the Back button skips the blank draft and returns to the page list
      router.replace(projectId ? `/pages/${newPage.id}?projectId=${projectId}` : `/pages/${newPage.id}`);
    } catch (err) {
      console.error('Error creating document:', err);
      setSaveStatus('error');
    }
  };

  const handleDeletePage = () => {
    if (isDraft) {
      router.push(projectId ? `/pages?projectId=${projectId}` : '/pages');
      return;
    }
    if (!selectedPage) return;
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedPage) return;
    setShowDeleteConfirm(false);
    try {
      await deletePage(selectedPage.id);
      router.push(projectId ? `/pages?projectId=${projectId}` : '/pages');
    } catch (err) {
      console.error('Error deleting page:', err);
    }
  };

  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedPage) return;

    setLocalError(null);

    // Enforce max file size: 1MB
    const MAX_FILE_SIZE = 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      setLocalError('File size exceeds the 1MB limit.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    const isMd = file.name.endsWith('.md');
    const isHtml = file.name.endsWith('.html') || file.name.endsWith('.htm');

    if (!isMd && !isHtml) {
      setLocalError('Invalid file type. Only Markdown (.md) and HTML (.html) files are allowed.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        let htmlContent = text;
        if (isMd) {
          const rawHtml = await marked.parse(text);
          htmlContent = typeof window !== 'undefined' ? DOMPurify.sanitize(rawHtml) : rawHtml;
        } else if (isHtml) {
          htmlContent = typeof window !== 'undefined' ? DOMPurify.sanitize(text) : text;
        }
        handleUpdateContent(htmlContent);
      } catch (err) {
        console.error('Error parsing file:', err);
        setLocalError('Failed to parse imported file.');
      }
    };
    reader.onerror = () => {
      setLocalError('Failed to read file.');
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleExport = () => {
    if (!selectedPage) return;
    const turndownService = new TurndownService({ headingStyle: 'atx' });
    const mdContent = turndownService.turndown(selectedPage.content || '');
    const blob = new Blob([mdContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return {
    pageId,
    isDraft,
    projectId,
    selectedPage,
    loadingPage,
    saveStatus,
    title, setTitle,
    showHistory, setShowHistory,
    historyMock,
    showDocSidebar, setShowDocSidebar,
    fileInputRef,
    filteredPages,
    error: error || localError,
    searchQuery, setSearchQuery,
    handleUpdateContent,
    setLatestContent,
    handleManualCreate,
    handleDeletePage,
    handleConfirmDelete,
    showDeleteConfirm, setShowDeleteConfirm,
    handleFileImport,
    handleExport,
    toggleStar,
    movePage,
  };
}
