import { renderHook, waitFor } from '@testing-library/react';
import axiosInstance from '../../../lib/axios';
import { getApiBaseUrl } from '../../../lib/api-base-url';
import { useDashboardProfile } from './useDashboardProfile';

// Mock axios instance to control API responses using relative path
jest.mock('../../../lib/axios', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
  },
}));

// Mock api-base-url helper using relative path
jest.mock('../../../lib/api-base-url', () => ({
  getApiBaseUrl: jest.fn(),
}));

const mockedAxios = axiosInstance as jest.Mocked<typeof axiosInstance>;
const mockedGetApiBaseUrl = getApiBaseUrl as jest.MockedFunction<typeof getApiBaseUrl>;

describe('useDashboardProfile hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedAxios.get.mockReset();
    mockedAxios.get.mockImplementation(() => new Promise(() => {}));
  });

  it('does not fetch profile if user is null', () => {
    mockedGetApiBaseUrl.mockReturnValue('http://localhost:8080');

    const { result } = renderHook(() => useDashboardProfile(null));

    expect(mockedAxios.get).not.toHaveBeenCalled();
    expect(result.current.resolvedProfilePicUrl).toBe('');
  });

  it('fetches profile and resolves relative URL with API base URL', async () => {
    mockedGetApiBaseUrl.mockReturnValue('http://localhost:8080');
    mockedAxios.get.mockResolvedValueOnce({
      data: { profilePicUrl: '/uploads/avatar.png' },
    });

    const { result } = renderHook(() => useDashboardProfile({ email: 'test@example.com' }));

    expect(mockedAxios.get).toHaveBeenCalledWith('/api/user/profile');

    await waitFor(() => {
      expect(result.current.resolvedProfilePicUrl).toBe('http://localhost:8080/uploads/avatar.png');
    });
  });

  it('resolves absolute profile URL without prepending base URL', async () => {
    mockedGetApiBaseUrl.mockReturnValue('http://localhost:8080');
    mockedAxios.get.mockResolvedValueOnce({
      data: { profilePicUrl: 'https://images.example.com/avatar.png' },
    });

    const { result } = renderHook(() => useDashboardProfile({ email: 'test@example.com' }));

    await waitFor(() => {
      expect(result.current.resolvedProfilePicUrl).toBe('https://images.example.com/avatar.png');
    });
  });

  it('falls back to empty string / relative path in development when base URL is missing', async () => {
    mockedGetApiBaseUrl.mockReturnValue('');
    mockedAxios.get.mockResolvedValueOnce({
      data: { profilePicUrl: '/uploads/avatar.png' },
    });

    const { result } = renderHook(() => useDashboardProfile({ email: 'test@example.com' }));

    await waitFor(() => {
      expect(result.current.resolvedProfilePicUrl).toBe('/uploads/avatar.png');
    });
  });
});
