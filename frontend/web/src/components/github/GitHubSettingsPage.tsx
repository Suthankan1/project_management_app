"use client";

import React, { useEffect, useState } from 'react';

import { fetchRepositories } from '../../../services/githubService';
import type { GitHubRepository } from '../../../services/githubService';

const GitHubSettingsPage: React.FC = () => {
  const [repositories, setRepositories] = useState<GitHubRepository[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadRepositories = async () => {
      try {
        const data = await fetchRepositories();
        setRepositories(data);
        setLoading(false);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch repositories';
        setError(errorMessage);
        setLoading(false);
      }
    };

    void loadRepositories();
  }, []);

  return (
    <div>
      <h1>GitHub Settings</h1>
      <h2>Connected Repositories</h2>

      {loading && <p>Loading repositories...</p>}

      {error !== null && (
        <div role="alert">
          {error}
        </div>
      )}

      {!loading && error === null && repositories.length === 0 && <p>No repositories found.</p>}

      {!loading && error === null && repositories.length > 0 && (
        <ul>
          {repositories.map((repository) => (
            <li key={repository.id}>
              <strong>{repository.full_name}</strong>{' '}
              <span>{repository.private ? 'Private' : 'Public'}</span>{' '}
              <span>Branch: {repository.default_branch}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default GitHubSettingsPage;
