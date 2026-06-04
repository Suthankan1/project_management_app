import { renderHook, act, waitFor } from '@testing-library/react';
import { usePageEditor } from './usePageEditor';
import { usePageContent } from './hooks/usePageContent';
import React from 'react';

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
  })),
  useParams: jest.fn(() => ({ pageId: '1' })),
  useSearchParams: jest.fn(() => ({
    get: (key: string) => (key === 'projectId' ? '123' : null),
  })),
}));

jest.mock('./hooks/usePageContent', () => ({
  usePageContent: jest.fn(),
}));

jest.mock('@/lib/auth', () => ({
  ...jest.requireActual('@/lib/auth'),
  getValidToken: jest.fn(() => 'mock-token'),
  getUserFromToken: jest.fn(() => ({
    email: 'test@example.com',
    username: 'testuser',
    userId: 1,
  })),
}));

jest.mock('marked', () => ({
  marked: {
    parse: jest.fn(async (text: string) => {
      if (text.includes('# Header')) {
        return '<h1>Header</h1><script>alert("hack")</script>Normal text with <a href="javascript:alert(1)">link</a>';
      }
      return `<p>${text}</p>`;
    }),
  },
}));

jest.mock('@/services/api-contract', () => ({
  pagesApi: {
    getVersions: jest.fn(async () => []),
    restoreVersion: jest.fn(async () => ({
      id: '1',
      title: 'Restored Page',
      content: '<p>Restored Content</p>',
      isStarred: false,
    })),
  },
}));

const mockUsePageContent = usePageContent as jest.Mock;

describe('usePageEditor Hook', () => {
  let mockSetSelectedPage: jest.Mock;
  let mockUpdatePage: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSetSelectedPage = jest.fn();
    mockUpdatePage = jest.fn();
    mockUsePageContent.mockReturnValue({
      selectedPage: { id: '1', title: 'Test Page', content: '<p>Initial Content</p>', isStarred: false },
      setSelectedPage: mockSetSelectedPage,
      title: 'Test Page',
      setTitle: jest.fn(),
      loadingPage: false,
      versions: [],
      setVersions: jest.fn(),
      isDraft: false,
      filteredPages: [],
      error: null,
      searchQuery: '',
      setSearchQuery: jest.fn(),
      updatePage: mockUpdatePage,
      createPage: jest.fn(),
      deletePage: jest.fn(),
      refetch: jest.fn(),
    });
  });

  it('rejects files larger than 1MB', async () => {
    const { result } = renderHook(() => usePageEditor());

    const largeFile = new File(['x'.repeat(1024 * 1024 + 1)], 'large.html', { type: 'text/html' });
    const event = {
      target: {
        files: [largeFile],
      },
    } as unknown as React.ChangeEvent<HTMLInputElement>;

    await act(async () => {
      await result.current.handleFileImport(event);
    });

    expect(result.current.error).toBe('File size exceeds the 1MB limit.');
  });

  it('rejects files with unsupported formats', async () => {
    const { result } = renderHook(() => usePageEditor());

    const txtFile = new File(['some text'], 'test.txt', { type: 'text/plain' });
    const event = {
      target: {
        files: [txtFile],
      },
    } as unknown as React.ChangeEvent<HTMLInputElement>;

    await act(async () => {
      await result.current.handleFileImport(event);
    });

    expect(result.current.error).toBe('Invalid file type. Only Markdown (.md) and HTML (.html) files are allowed.');
  });

  it('imports and sanitizes HTML containing script tags', async () => {
    const { result } = renderHook(() => usePageEditor());

    const maliciousHtml = '<div>Safe HTML</div><script>alert("hack")</script><img src="x" onerror="alert(1)">';
    const htmlFile = new File([maliciousHtml], 'malicious.html', { type: 'text/html' });
    
    const event = {
      target: {
        files: [htmlFile],
      },
    } as unknown as React.ChangeEvent<HTMLInputElement>;

    await act(async () => {
      await result.current.handleFileImport(event);
    });

    // Wait for the FileReader async onload event to finish
    await waitFor(() => {
      expect(mockSetSelectedPage).toHaveBeenCalled();
    });

    const callArg = mockSetSelectedPage.mock.calls[0][0];
    const dummyPrevState = { id: '1', title: 'Test Page', content: '<p>Initial Content</p>' };
    const updatedState = callArg(dummyPrevState);

    // script tag and onerror event handler should be stripped out by DOMPurify
    expect(updatedState.content).toContain('<div>Safe HTML</div><img src="x">');
    expect(updatedState.content).not.toContain('<script>');
    expect(updatedState.content).not.toContain('onerror');
  });

  it('imports and sanitizes Markdown containing malicious HTML', async () => {
    const { result } = renderHook(() => usePageEditor());

    const maliciousMarkdown = '# Header\n\n<script>alert("hack")</script>\n\nNormal text with [link](javascript:alert(1))';
    const mdFile = new File([maliciousMarkdown], 'malicious.md', { type: 'text/markdown' });

    const event = {
      target: {
        files: [mdFile],
      },
    } as unknown as React.ChangeEvent<HTMLInputElement>;

    await act(async () => {
      await result.current.handleFileImport(event);
    });

    await waitFor(() => {
      expect(mockSetSelectedPage).toHaveBeenCalled();
    });

    const callArg = mockSetSelectedPage.mock.calls[0][0];
    const dummyPrevState = { id: '1', title: 'Test Page', content: '<p>Initial Content</p>' };
    const updatedState = callArg(dummyPrevState);

    // Verify it was converted to HTML and script / javascript: link are sanitized
    expect(updatedState.content).toContain('<h1>Header</h1>');
    expect(updatedState.content).not.toContain('<script>');
    expect(updatedState.content).not.toContain('href="javascript:');
  });

  it('restores a version and updates state', async () => {
    const { result } = renderHook(() => usePageEditor());
    const { pagesApi } = require('@/services/api-contract');

    await act(async () => {
      await result.current.handleRestoreVersion('version-123');
    });

    expect(pagesApi.restoreVersion).toHaveBeenCalledWith('123', '1', 'version-123');
    expect(mockSetSelectedPage).toHaveBeenCalledWith({
      id: '1',
      title: 'Restored Page',
      content: '<p>Restored Content</p>',
      isStarred: false,
    });
  });

  it('initializes ydoc and provider when token is present', () => {
    const { result } = renderHook(() => usePageEditor());
    expect(result.current.ydoc).toBeDefined();
    expect(result.current.ydoc).not.toBeNull();
    expect(result.current.provider).toBeDefined();
    expect(result.current.provider).not.toBeNull();
  });
});
