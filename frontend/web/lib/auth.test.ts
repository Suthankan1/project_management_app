import { refreshAccessToken, saveRefreshToken } from './auth';

describe('auth requestRefreshAccessToken URL handling', () => {
  const originalEnv = process.env;
  const fetchMock = jest.fn();

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
    global.fetch = fetchMock as unknown as typeof fetch;
    window.localStorage.clear();
    window.sessionStorage.clear();
    fetchMock.mockReset();
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('calls the backend base URL when NEXT_PUBLIC_API_BASE_URL is set', async () => {
    process.env.NEXT_PUBLIC_API_BASE_URL = 'https://api.example.com';
    saveRefreshToken('mock-refresh-token');

    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ token: 'new-access-token', refreshToken: 'new-refresh-token' }),
    });

    const token = await refreshAccessToken();

    expect(token).toBe('new-access-token');
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toBe('https://api.example.com/api/auth/refresh');
    expect(fetchMock.mock.calls[0][1]).toMatchObject({
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
  });

  it('falls back to localhost in development when NEXT_PUBLIC_API_BASE_URL is not set', async () => {
    Object.defineProperty(process.env, 'NODE_ENV', { value: 'development', configurable: true });
    delete process.env.NEXT_PUBLIC_API_BASE_URL;
    saveRefreshToken('mock-refresh-token');

    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ token: 'new-access-token-dev' }),
    });

    const token = await refreshAccessToken();

    expect(token).toBe('new-access-token-dev');
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toBe('http://localhost:8080/api/auth/refresh');
  });

  it('throws in production when NEXT_PUBLIC_API_BASE_URL is missing', async () => {
    Object.defineProperty(process.env, 'NODE_ENV', { value: 'production', configurable: true });
    delete process.env.NEXT_PHASE;
    delete process.env.NEXT_PUBLIC_API_BASE_URL;
    saveRefreshToken('mock-refresh-token');

    await expect(refreshAccessToken()).rejects.toThrow('NEXT_PUBLIC_API_BASE_URL environment variable is missing.');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('falls back to localhost during Next production build when NEXT_PUBLIC_API_BASE_URL is missing', async () => {
    Object.defineProperty(process.env, 'NODE_ENV', { value: 'production', configurable: true });
    process.env.NEXT_PHASE = 'phase-production-build';
    delete process.env.NEXT_PUBLIC_API_BASE_URL;
    saveRefreshToken('mock-refresh-token');

    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ token: 'new-access-token-build' }),
    });

    const token = await refreshAccessToken();

    expect(token).toBe('new-access-token-build');
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toBe('http://localhost:8080/api/auth/refresh');
  });
});
