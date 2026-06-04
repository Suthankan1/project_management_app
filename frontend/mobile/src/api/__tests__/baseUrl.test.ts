async function loadResolver(options: {
  apiUrl: string;
  hostUri?: string;
  os: 'android' | 'ios' | 'web';
}) {
  jest.resetModules();
  process.env.EXPO_PUBLIC_API_URL = options.apiUrl;

  jest.doMock('react-native', () => ({
    Platform: { OS: options.os },
  }));

  jest.doMock('expo-constants', () => ({
    __esModule: true,
    default: {
      expoConfig: { hostUri: options.hostUri },
      manifest: {},
      manifest2: {},
    },
  }));

  return import('../baseUrl');
}

describe('resolveApiBaseUrl', () => {
  afterEach(() => {
    delete process.env.EXPO_PUBLIC_API_URL;
    jest.resetModules();
  });

  test('keeps configured URL on web', async () => {
    const { resolveApiBaseUrl } = await loadResolver({
      apiUrl: 'http://localhost:8080',
      os: 'web',
    });

    expect(resolveApiBaseUrl()).toBe('http://localhost:8080');
  });

  test('maps localhost to Expo dev host on native devices', async () => {
    const { resolveApiBaseUrl } = await loadResolver({
      apiUrl: 'http://localhost:8080',
      hostUri: '192.168.1.20:8081',
      os: 'ios',
    });

    expect(resolveApiBaseUrl()).toBe('http://192.168.1.20:8080');
  });

  test('maps Android localhost to emulator host when no Expo dev host exists', async () => {
    const { resolveApiBaseUrl } = await loadResolver({
      apiUrl: 'http://127.0.0.1:8080',
      os: 'android',
    });

    expect(resolveApiBaseUrl()).toBe('http://10.0.2.2:8080');
  });
});
