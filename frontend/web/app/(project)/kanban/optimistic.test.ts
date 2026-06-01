import { optimisticUpdateTaskStatusHelper } from './hooks/useKanbanActions';

describe('optimisticUpdateTaskStatusHelper', () => {
  const tasks = [ { id: 1, status: 'TODO' }, { id: 2, status: 'IN_PROGRESS' } ];

  it('applies optimistic update and resolves on success', async () => {
    const setTasks = jest.fn();
    const updateFn = jest.fn().mockResolvedValueOnce({ id: 1, status: 'IN_REVIEW' });

    await expect(optimisticUpdateTaskStatusHelper(tasks, setTasks, 1, 'IN_REVIEW', updateFn)).resolves.toEqual({ success: true });

    expect(setTasks).toHaveBeenCalled();
    // first call should be optimistic updater
    const firstCall = setTasks.mock.calls[0][0];
    const optimistic = firstCall(tasks);
    expect(optimistic.find((t: any) => t.id === 1).status).toBe('IN_REVIEW');
    expect(updateFn).toHaveBeenCalledWith(1, 'IN_REVIEW', undefined);
  });

  it('reverts optimistic update on failure', async () => {
    const setTasks = jest.fn();
    const updateFn = jest.fn().mockRejectedValueOnce(new Error('Network'));

    await expect(optimisticUpdateTaskStatusHelper(tasks, setTasks, 1, 'DONE', updateFn)).rejects.toThrow('Network');

    expect(setTasks).toHaveBeenCalledTimes(2);
    const optimisticUpdater = setTasks.mock.calls[0][0];
    const revertedUpdater = setTasks.mock.calls[1][0];
    const optimistic = optimisticUpdater(tasks);
    expect(optimistic.find((t: any) => t.id === 1).status).toBe('DONE');
    const reverted = revertedUpdater(tasks);
    expect(reverted.find((t: any) => t.id === 1).status).toBe('TODO');
  });
});
