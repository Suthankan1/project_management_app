import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ActivityFeed } from './ActivityFeed';
import { Task } from '@/types';

describe('ActivityFeed Component', () => {
  it('renders empty state when no tasks are provided', () => {
    render(<ActivityFeed tasks={[]} />);
    expect(screen.getByText('No recent updates')).toBeInTheDocument();
  });

  it('renders the activity feed with sorted tasks', () => {
    const mockTasks = [
      { id: 1, title: 'Old Task', status: 'IN_PROGRESS', assigneeName: 'Alice', updatedAt: new Date(Date.now() - 10000000).toISOString() },
      { id: 2, title: 'Recent Task', status: 'DONE', assigneeName: 'Bob', updatedAt: new Date(Date.now() - 60000).toISOString() },
    ] as Task[];

    render(<ActivityFeed tasks={mockTasks} />);
    
    // Check if the most recent task is rendered correctly
    expect(screen.getByText('Recent Task')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
    expect(screen.getByText('completed')).toBeInTheDocument();
    expect(screen.getByText('TSK-2')).toBeInTheDocument();

    // Check if old task is also rendered correctly
    expect(screen.getByText('Old Task')).toBeInTheDocument();
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('updated')).toBeInTheDocument();
  });

  it('displays correct initial fallback for assignees without names', () => {
    const mockTasks = [
      { id: 3, title: 'Anonymous Task', status: 'IN_PROGRESS', updatedAt: new Date().toISOString() },
    ] as Task[];

    render(<ActivityFeed tasks={mockTasks} />);
    expect(screen.getByText('Someone')).toBeInTheDocument();
    expect(screen.getByText('Anonymous Task')).toBeInTheDocument();
  });
});
