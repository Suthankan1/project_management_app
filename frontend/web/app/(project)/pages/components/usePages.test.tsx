import { act, renderHook, waitFor } from '@testing-library/react';
import axiosInstance from '../../../../lib/axios';
import { usePages } from './usePages';

jest.mock('../../../../lib/axios', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  },
}));

const mockedAxios = axiosInstance as jest.Mocked<typeof axiosInstance>;

describe('usePages hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  it('loads pages and filters by search and tab', async () => {
    mockedAxios.get.mockResolvedValueOnce({
      data: [
        { id: 1, title: 'Release Notes' },
        { id: 2, title: 'Architecture' },
      ],
    });

    const { result } = renderHook(() => usePages(7));

    await waitFor(() => {
      expect(result.current.pages).toHaveLength(2);
    });

    act(() => {
      result.current.toggleStar(2);
      result.current.setActiveTab('starred');
      result.current.setSearchQuery('arch');
    });

    expect(result.current.filteredPages).toHaveLength(1);
    expect(result.current.filteredPages[0].title).toBe('Architecture');
  });

  it('create/update/delete page updates local state', async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: [] });
    mockedAxios.post.mockResolvedValueOnce({
      data: { id: 11, title: 'Spec', content: 'v1', updatedAt: '2026-03-01T12:00:00' },
    });
    mockedAxios.put.mockResolvedValueOnce({
      data: { id: 11, title: 'Spec v2', content: 'v2', updatedAt: '2026-03-02T12:00:00' },
    });
    mockedAxios.delete.mockResolvedValueOnce({});

    const { result } = renderHook(() => usePages(5));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.createPage('Spec', 'v1');
    });
    expect(result.current.pages).toHaveLength(1);

    await act(async () => {
      await result.current.updatePage(11, 'Spec v2', 'v2');
    });
    expect(result.current.pages[0].title).toBe('Spec v2');

    await act(async () => {
      await result.current.deletePage(11);
    });
    expect(result.current.pages).toHaveLength(0);
  });

  it('keeps a created page visible after the hook reloads from cache', async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: [] });
    mockedAxios.post.mockResolvedValueOnce({
      data: { id: 11, title: 'Spec', content: 'v1', updatedAt: '2026-03-01T12:00:00' },
    });

    const { result, unmount } = renderHook(() => usePages(5));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.createPage('Spec', 'v1');
    });
    expect(result.current.pages).toHaveLength(1);
    unmount();

    mockedAxios.get.mockRejectedValueOnce(new Error('Network Error'));
    const { result: reloaded } = renderHook(() => usePages(5));

    await waitFor(() => {
      expect(reloaded.current.pages).toHaveLength(1);
    });
    expect(reloaded.current.pages[0].title).toBe('Spec');
  });

  it('reloads updated page metadata from cache without unsupported content fields', async () => {
    mockedAxios.get.mockResolvedValueOnce({
      data: [{ id: 11, title: 'Spec', updatedAt: '2026-03-01T12:00:00' }],
    });
    mockedAxios.put.mockResolvedValueOnce({
      data: { id: 11, title: 'Spec v2', content: 'v2', updatedAt: '2026-03-02T12:00:00' },
    });

    const { result, unmount } = renderHook(() => usePages(5));

    await waitFor(() => {
      expect(result.current.pages).toHaveLength(1);
    });

    await act(async () => {
      await result.current.updatePage(11, 'Spec v2', 'v2');
    });
    expect(result.current.pages[0].title).toBe('Spec v2');
    unmount();

    mockedAxios.get.mockRejectedValueOnce(new Error('Network Error'));
    const { result: reloaded } = renderHook(() => usePages(5));

    await waitFor(() => {
      expect(reloaded.current.pages[0].title).toBe('Spec v2');
    });
    expect(reloaded.current.pages[0].content).toBeUndefined();
  });

  it('does not resurrect a deleted page from stale localStorage after reload', async () => {
    localStorage.setItem(
      'planora:pages:5',
      JSON.stringify({
        version: 2,
        projectId: '5',
        timestamp: Date.now(),
        pages: [{ id: 11, title: 'Spec', updatedAt: '2026-03-01T12:00:00' }],
      })
    );
    mockedAxios.get.mockRejectedValueOnce(new Error('Network Error'));
    mockedAxios.delete.mockResolvedValueOnce({});

    const { result, unmount } = renderHook(() => usePages(5));

    await waitFor(() => {
      expect(result.current.pages).toHaveLength(1);
    });

    await act(async () => {
      await result.current.deletePage(11);
    });
    expect(result.current.pages).toHaveLength(0);
    unmount();

    mockedAxios.get.mockRejectedValueOnce(new Error('Network Error'));
    const { result: reloaded } = renderHook(() => usePages(5));

    await waitFor(() => {
      expect(reloaded.current.loading).toBe(false);
    });
    expect(reloaded.current.pages).toHaveLength(0);
  });

  it('toggles star with optimistic updates and falls back on error', async () => {
    mockedAxios.get.mockResolvedValueOnce({
      data: [{ id: 1, title: 'Release Notes', isStarred: false }],
    });
    mockedAxios.patch.mockResolvedValueOnce({
      data: { id: 1, title: 'Release Notes', isStarred: true },
    });
    mockedAxios.patch.mockRejectedValueOnce(new Error('Network Error'));

    const { result } = renderHook(() => usePages(7));

    await waitFor(() => {
      expect(result.current.pages).toHaveLength(1);
    });

    act(() => {
      result.current.toggleStar(1);
    });
    expect(result.current.pages[0].isStarred).toBe(true);

    await waitFor(() => {
      expect(result.current.pages[0].isStarred).toBe(true);
    });

    act(() => {
      result.current.toggleStar(1);
    });
    expect(result.current.pages[0].isStarred).toBe(false);
    
    await waitFor(() => {
      expect(result.current.pages[0].isStarred).toBe(true);
    });
  });

  it('moves page and updates parentPageId', async () => {
    mockedAxios.get.mockResolvedValueOnce({
      data: [{ id: 1, title: 'Child', parentPageId: null }],
    });
    mockedAxios.patch.mockResolvedValueOnce({
      data: { id: 1, title: 'Child', parentPageId: 3 },
    });

    const { result } = renderHook(() => usePages(7));

    await waitFor(() => {
      expect(result.current.pages).toHaveLength(1);
    });

    await act(async () => {
      await result.current.movePage(1, 3);
    });

    expect(result.current.pages[0].parentId).toBe(3);
  });

  it('fetches recent pages when tab changes to recent', async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: [] });
    mockedAxios.get.mockResolvedValueOnce({
      data: [{ id: 1, title: 'Recent Document' }],
    });

    const { result } = renderHook(() => usePages(7));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      result.current.setActiveTab('recent');
    });

    await waitFor(() => {
      expect(result.current.filteredPages).toHaveLength(1);
      expect(result.current.filteredPages[0].title).toBe('Recent Document');
    });
  });

  it('sets a friendly error when project id is missing', async () => {
    const { result } = renderHook(() => usePages(null));

    await waitFor(() => {
      expect(result.current.error).toBe('Project ID not found');
    });
  });
});
