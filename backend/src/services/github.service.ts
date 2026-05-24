import GitHubRepository from '../types/github.types';

export async function fetchUserRepositories(accessToken: string): Promise<GitHubRepository[]> {
  const response = await fetch('https://api.github.com/user/repos', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/vnd.github.v3+json',
      'User-Agent': 'Planora-App',
    },
  });

  if (response.status === 401) {
    throw new Error('Invalid or expired GitHub token');
  }

  if (response.status === 403 && response.headers.get('x-ratelimit-remaining') === '0') {
    throw new Error('GitHub API rate limit exceeded');
  }

  if (!response.ok) {
    throw new Error(`GitHub API error: ${response.status}`);
  }

  return (await response.json()) as GitHubRepository[];
}
