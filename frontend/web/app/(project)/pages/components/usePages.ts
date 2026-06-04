'use client';

import { useState, useEffect, useCallback } from 'react';
import { pagesApi } from '@/services/api-contract';

import { PageItem } from './types';
export type { PageItem };

interface UsePagesReturn {
  pages: PageItem[];
  filteredPages: PageItem[];
  loading: boolean;
  error: string | null;
  activeTab: 'all' | 'starred' | 'recent';
  setActiveTab: (tab: 'all' | 'starred' | 'recent') => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  createPage: (title: string, content: string) => Promise<PageItem>;
  updatePage: (pageId: string | number, title: string, content: string) => Promise<PageItem>;
  deletePage: (pageId: string | number) => Promise<void>;
  refetch: () => Promise<void>;
  toggleStar: (pageId: string | number) => void;
  movePage: (pageId: string | number, parentPageId: string | number | null) => Promise<void>;
}

export function usePages(projectId: string | number | null): UsePagesReturn {
  const [pages, setPages] = useState<PageItem[]>([]);
  const [recentPages, setRecentPages] = useState<PageItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'starred' | 'recent'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch all pages for the project
  const fetchPages = useCallback(async () => {
    if (!projectId) {
      setError('Project ID not found');
      return;
    }

    const cacheKey = `planora:pages:${projectId}`;
    // Stale-while-revalidate: the sidebar populates instantly from cache while the fresh list loads in the background
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      try {
        setPages(JSON.parse(cached) as PageItem[]);
        setLoading(false);
      } catch { /* ignore corrupt cache */ }
    }

    setError(null);
    try {
      const response = await pagesApi.listByProject(projectId);
      const pagesData = (response || []).map((page) => ({
        id: page.id,
        title: page.title,
        parentId: page.parentPageId,
        isStarred: page.isStarred || false,
        updatedAt: page.updatedAt,
      }));
      setPages(pagesData);
      localStorage.setItem(cacheKey, JSON.stringify(pagesData));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to fetch pages';
      if (!cached) setError(message);
      console.error('Error fetching pages:', err);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  // Fetch pages on mount or when projectId changes
  useEffect(() => {
    fetchPages();
  }, [projectId, fetchPages]);

  const fetchRecentPages = useCallback(async () => {
    if (!projectId) return;
    try {
      const response = await pagesApi.getRecent(projectId);
      const recentData = (response || []).map((page) => ({
        id: page.id,
        title: page.title,
        parentId: page.parentPageId,
        isStarred: page.isStarred || false,
        updatedAt: page.updatedAt,
      }));
      setRecentPages(recentData);
    } catch (err) {
      console.error('Error fetching recent pages:', err);
    }
  }, [projectId]);

  useEffect(() => {
    if (activeTab === 'recent') {
      void fetchRecentPages();
    }
  }, [activeTab, fetchRecentPages]);

  // Filter pages based on active tab and search query
  const filteredPages = (activeTab === 'recent' ? recentPages : pages).filter((page) => {
    const matchesSearch = page.title.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (!matchesSearch) return false;

    switch (activeTab) {
      case 'starred':
        return page.isStarred;
      case 'recent':
        return true;
      case 'all':
      default:
        return true;
    }
  });

  // Create a new page
  const createPage = async (title: string, content: string): Promise<PageItem> => {
    if (!projectId) throw new Error('Project ID not found');

    try {
      const response = await pagesApi.create(projectId, { title, content });
      const newPage: PageItem = {
        id: response.id,
        title: response.title,
        content: response.content,
        updatedAt: response.updatedAt,
        isStarred: false,
      };
      setPages((prev) => [...prev, newPage]);
      return newPage;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to create page';
      setError(message);
      throw new Error(message);
    }
  };

  // Update an existing page
  const updatePage = async (pageId: string | number, title: string, content: string): Promise<PageItem> => {
    try {
      const response = await pagesApi.update(pageId, {
        title,
        content,
      });
      const updatedPage: PageItem = {
        id: response.id,
        title: response.title,
        content: response.content,
        updatedAt: response.updatedAt,
        isStarred: pages.find((p) => p.id === pageId)?.isStarred || false,
      };
      setPages((prev) => prev.map((p) => (p.id === pageId ? updatedPage : p)));
      return updatedPage;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to update page';
      setError(message);
      throw new Error(message);
    }
  };

  // Delete a page
  const deletePage = async (pageId: string | number): Promise<void> => {
    try {
      await pagesApi.delete(pageId);
      setPages((prev) => prev.filter((p) => p.id !== pageId));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to delete page';
      setError(message);
      throw new Error(message);
    }
  };

  // Toggle star status
  const toggleStar = async (pageId: string | number) => {
    if (!projectId) return;
    try {
      // Optimistic update
      setPages((prev) => prev.map((p) => (p.id === pageId ? { ...p, isStarred: !p.isStarred } : p)));
      setRecentPages((prev) => prev.map((p) => (p.id === pageId ? { ...p, isStarred: !p.isStarred } : p)));
      
      const response = await pagesApi.toggleStar(projectId, pageId);
      setPages((prev) => prev.map((p) => (p.id === pageId ? { ...p, isStarred: response.isStarred || false } : p)));
      setRecentPages((prev) => prev.map((p) => (p.id === pageId ? { ...p, isStarred: response.isStarred || false } : p)));
    } catch (err) {
      console.error('Error toggling star:', err);
      // Revert optimistic update
      setPages((prev) => prev.map((p) => (p.id === pageId ? { ...p, isStarred: !p.isStarred } : p)));
      setRecentPages((prev) => prev.map((p) => (p.id === pageId ? { ...p, isStarred: !p.isStarred } : p)));
    }
  };

  // Move page status
  const movePage = async (pageId: string | number, parentPageId: string | number | null) => {
    if (!projectId) return;
    try {
      // Optimistic update
      setPages((prev) => prev.map((p) => (p.id === pageId ? { ...p, parentId: parentPageId } : p)));
      const response = await pagesApi.movePage(projectId, pageId, parentPageId);
      setPages((prev) => prev.map((p) => (p.id === pageId ? { ...p, parentId: response.parentPageId || null } : p)));
    } catch (err) {
      console.error('Error moving page:', err);
      refetch();
      throw err;
    }
  };

  // Refetch pages
  const refetch = fetchPages;

  return {
    pages,
    filteredPages,
    loading,
    error,
    activeTab,
    setActiveTab,
    searchQuery,
    setSearchQuery,
    createPage,
    updatePage,
    deletePage,
    refetch,
    toggleStar,
    movePage,
  };
}
