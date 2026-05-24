export interface GitHubOwner {
  login: string;
}

export interface GitHubRepository {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  owner: GitHubOwner;
  default_branch: string;
}

export default GitHubRepository;

export interface GitHubApiError {
  message: string;
  status: number;
}
