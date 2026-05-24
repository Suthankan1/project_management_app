import { useState, useCallback } from 'react';
import { ChatSearchResult } from '../../types/chat';
import * as chatService from '../../services/chatService';

export function useChatSearch(projectId: string) {
  const [searchResults, setSearchResults] = useState<ChatSearchResult[]>([]);
  const [isSearchLoading, setIsSearchLoading] = useState(false);

  const searchMessages = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearchLoading(true);
    try {
      const data = await chatService.searchMessages(projectId, query);
      setSearchResults(data);
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setIsSearchLoading(false);
    }
  }, [projectId]);

  return {
    searchResults,
    isSearchLoading,
    searchMessages,
    setSearchResults,
  };
}
