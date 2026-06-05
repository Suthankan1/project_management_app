import api from '../../api/axios';
import { projectService } from '../project-service';

jest.mock('../../api/axios', () => ({
  delete: jest.fn(),
  get: jest.fn(),
  patch: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
}));

describe('projectService member cache', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    projectService.clearMembersCache();
  });

  test('caches fresh project members by project id', async () => {
    (api.get as jest.Mock).mockResolvedValueOnce({
      data: [{ id: 1, user: { userId: 10, fullName: 'Ada Lovelace' } }],
    });

    await expect(projectService.getMembersCached(7)).resolves.toHaveLength(1);
    await expect(projectService.getMembersCached(7)).resolves.toHaveLength(1);

    expect(api.get).toHaveBeenCalledTimes(1);
    expect(api.get).toHaveBeenCalledWith('/api/projects/7/members');
  });

  test('dedupes in-flight project member requests', async () => {
    (api.get as jest.Mock).mockResolvedValueOnce({
      data: [{ id: 2, user: { userId: 20, username: 'grace' } }],
    });

    await Promise.all([
      projectService.getMembersCached(8),
      projectService.getMembersCached(8),
    ]);

    expect(api.get).toHaveBeenCalledTimes(1);
  });

  test('force retry reloads members after a failure', async () => {
    (api.get as jest.Mock)
      .mockRejectedValueOnce(new Error('network'))
      .mockResolvedValueOnce({ data: [{ id: 3, user: { userId: 30, username: 'linus' } }] });

    await expect(projectService.getMembersCached(9)).rejects.toThrow('network');
    await expect(projectService.getMembersCached(9, { force: true })).resolves.toHaveLength(1);

    expect(api.get).toHaveBeenCalledTimes(2);
  });
});
