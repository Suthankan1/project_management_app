import { useLoginForm } from '../useLoginForm';
import { useRegisterForm } from '../useRegisterForm';
import { clearTokens, getValidToken, saveToken } from '../../lib/auth';

function createJwt(payload: Record<string, unknown>) {
  const encodedPayload = globalThis
    .btoa(JSON.stringify(payload))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  return `header.${encodedPayload}.signature`;
}

describe('auth hooks smoke tests', () => {
  test('exports login and register hooks', () => {
    expect(useLoginForm).toEqual(expect.any(Function));
    expect(useRegisterForm).toEqual(expect.any(Function));
  });

  test('auth token helpers return saved unexpired tokens and clear them', async () => {
    const token = createJwt({
      sub: 'dev@example.com',
      username: 'dev',
      userId: 7,
      exp: 4_102_444_800,
    });

    await saveToken(token);

    await expect(getValidToken()).resolves.toBe(token);

    await clearTokens();

    await expect(getValidToken()).resolves.toBeNull();
  });
});
