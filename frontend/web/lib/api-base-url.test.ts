import { getApiBaseUrl } from './api-base-url';

describe('getApiBaseUrl', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('returns the URL when NEXT_PUBLIC_API_BASE_URL is set', () => {
    process.env.NEXT_PUBLIC_API_BASE_URL = 'https://api.example.com';
    expect(getApiBaseUrl()).toBe('https://api.example.com');
  });

  it('returns localhost fallback in development when NEXT_PUBLIC_API_BASE_URL is not set', () => {
    (process.env as any).NODE_ENV = 'development';
    delete process.env.NEXT_PUBLIC_API_BASE_URL;
    expect(getApiBaseUrl()).toBe('http://localhost:8080');
  });

  it('throws in production when NEXT_PUBLIC_API_BASE_URL is missing', () => {
    (process.env as any).NODE_ENV = 'production';
    delete process.env.NEXT_PUBLIC_API_BASE_URL;
    expect(() => getApiBaseUrl()).toThrow('NEXT_PUBLIC_API_BASE_URL environment variable is missing.');
  });
});
