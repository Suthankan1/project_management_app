import type { Request, Response } from 'express';

import { fetchUserRepositories } from '../services/github.service';

export async function getRepositories(req: Request, res: Response): Promise<void> {
  const githubAccessToken = req.user?.githubAccessToken;

  if (!githubAccessToken) {
    res.status(401).json({
      error: 'GitHub access token not found. Please reconnect your GitHub account.',
    });
    return;
  }

  try {
    const repositories = await fetchUserRepositories(githubAccessToken);
    res.status(200).json(repositories);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    if (message.includes('Invalid or expired GitHub token')) {
      res.status(401).json({
        error: 'Your GitHub token is invalid or has expired. Please reconnect your GitHub account.',
      });
      return;
    }

    if (message.toLowerCase().includes('rate limit')) {
      res.status(429).json({
        error: 'GitHub API rate limit exceeded. Please try again later.',
      });
      return;
    }

    res.status(502).json({
      error: 'Failed to fetch repositories from GitHub. Please try again.',
    });
  }
}
