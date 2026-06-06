import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { SWRConfig } from 'swr';
import CreateTaskModal from './CreateTaskModal';
import { projectsApi } from '@/services/api-contract';

jest.mock('@/services/api-contract', () => ({
  projectsApi: {
    get: jest.fn(),
    getTeamMembers: jest.fn(),
  },
}));

const mockedProjectsApi = projectsApi as jest.Mocked<typeof projectsApi>;

function renderModal(isOpen = true) {
  const cache = new Map();
  return render(
    <SWRConfig value={{ provider: () => cache, dedupingInterval: 60_000 }}>
      <CreateTaskModal
        isOpen={isOpen}
        onClose={jest.fn()}
        onCreateTask={jest.fn().mockResolvedValue(undefined)}
        projectId={7}
      />
    </SWRConfig>
  );
}

describe('CreateTaskModal assignee loading', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedProjectsApi.get.mockResolvedValue({ id: 7, teamId: 3, name: 'Alpha' });
  });

  it('loads and renders project members as assignee options', async () => {
    mockedProjectsApi.getTeamMembers.mockResolvedValue([
      { id: 11, user: { userId: 101, fullName: 'Ada Lovelace' } },
    ]);

    renderModal();

    expect(screen.getByRole('combobox')).toBeDisabled();
    expect(screen.getByText('Loading assignees...')).toBeInTheDocument();

    await waitFor(() => expect(screen.getByText('Ada Lovelace')).toBeInTheDocument());
    expect(screen.getByRole('combobox')).not.toBeDisabled();
    expect(mockedProjectsApi.get).toHaveBeenCalledTimes(1);
    expect(mockedProjectsApi.getTeamMembers).toHaveBeenCalledTimes(1);
  });

  it('shows an inline error when assignees fail to load', async () => {
    mockedProjectsApi.getTeamMembers.mockRejectedValue(new Error('network'));

    renderModal();

    await waitFor(() => {
      expect(screen.getByText('Unable to load project members. Assignee options may be unavailable.')).toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
  });

  it('retries member loading from the inline error', async () => {
    mockedProjectsApi.getTeamMembers
      .mockRejectedValueOnce(new Error('network'))
      .mockResolvedValueOnce([{ id: 12, user: { userId: 102, username: 'grace' } }]);

    renderModal();

    await screen.findByText('Unable to load project members. Assignee options may be unavailable.');
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));

    await waitFor(() => expect(screen.getByText('grace')).toBeInTheDocument());
    expect(mockedProjectsApi.getTeamMembers).toHaveBeenCalledTimes(2);
  });

  it('does not refetch fresh cached members when reopened', async () => {
    mockedProjectsApi.getTeamMembers.mockResolvedValue([
      { id: 11, user: { userId: 101, fullName: 'Ada Lovelace' } },
    ]);

    const cache = new Map();
    const view = render(
      <SWRConfig value={{ provider: () => cache, dedupingInterval: 60_000 }}>
        <CreateTaskModal
          isOpen={true}
          onClose={jest.fn()}
          onCreateTask={jest.fn().mockResolvedValue(undefined)}
          projectId={7}
        />
      </SWRConfig>
    );

    await screen.findByText('Ada Lovelace');

    view.rerender(
      <SWRConfig value={{ provider: () => cache, dedupingInterval: 60_000 }}>
        <CreateTaskModal
          isOpen={false}
          onClose={jest.fn()}
          onCreateTask={jest.fn().mockResolvedValue(undefined)}
          projectId={7}
        />
      </SWRConfig>
    );
    view.rerender(
      <SWRConfig value={{ provider: () => cache, dedupingInterval: 60_000 }}>
        <CreateTaskModal
          isOpen={true}
          onClose={jest.fn()}
          onCreateTask={jest.fn().mockResolvedValue(undefined)}
          projectId={7}
        />
      </SWRConfig>
    );

    await screen.findByText('Ada Lovelace');
    expect(mockedProjectsApi.getTeamMembers).toHaveBeenCalledTimes(1);
  });
});
