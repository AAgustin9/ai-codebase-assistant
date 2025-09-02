/**
 * Interface for GitHub repository operations
 */
export interface IGitHubRepoTools {
  /**
   * Gets information about a repository
   * @param owner Repository owner
   * @param repo Repository name
   * @returns Repository information
   */
  getRepositoryInfo(owner: string, repo: string): Promise<any>;
  
  /**
   * Lists files in a repository directory
   * @param owner Repository owner
   * @param repo Repository name
   * @param path Directory path
   * @param ref Branch or commit SHA
   * @returns List of files
   */
  listFiles(owner: string, repo: string, path: string, ref?: string): Promise<any[]>;
  
  /**
   * Gets content of a file in a repository
   * @param owner Repository owner
   * @param repo Repository name
   * @param path File path
   * @param ref Branch or commit SHA
   * @returns File content and metadata
   */
  getFileContent(owner: string, repo: string, path: string, ref?: string): Promise<any>;

  /**
   * Creates or updates a file in a repository
   * @param owner Repository owner
   * @param repo Repository name
   * @param path File path
   * @param content File content
   * @param message Commit message
   * @param branch Branch name (defaults to main)
   * @param sha SHA of file (required for updates, optional for new files)
   * @returns Created or updated file data
   */
  writeFile(
    owner: string, 
    repo: string, 
    path: string, 
    content: string, 
    message: string,
    branch?: string,
    sha?: string
  ): Promise<any>;
}

/**
 * Interface for GitHub issue operations
 */
export interface IGitHubIssueTools {
  /**
   * Creates a new issue in a repository
   * @param owner Repository owner
   * @param repo Repository name
   * @param title Issue title
   * @param body Issue body
   * @param labels Optional labels
   * @returns Created issue
   */
  createIssue(owner: string, repo: string, title: string, body: string, labels?: string[]): Promise<any>;
  
  /**
   * Lists issues in a repository
   * @param owner Repository owner
   * @param repo Repository name
   * @param state Issue state (open, closed, all)
   * @param labels Optional labels filter
   * @returns List of issues
   */
  listIssues(owner: string, repo: string, state?: string, labels?: string[]): Promise<any[]>;
  
  /**
   * Gets information about a specific issue
   * @param owner Repository owner
   * @param repo Repository name
   * @param issueNumber Issue number
   * @returns Issue information
   */
  getIssue(owner: string, repo: string, issueNumber: number): Promise<any>;
}

/**
 * Interface for GitHub pull request operations
 */
export interface IGitHubPRTools {
  /**
   * Creates a new pull request
   * @param owner Repository owner
   * @param repo Repository name
   * @param title PR title
   * @param body PR description
   * @param head Source branch
   * @param base Target branch
   * @returns Created pull request
   */
  createPullRequest(
    owner: string,
    repo: string,
    title: string,
    body: string,
    head: string,
    base: string
  ): Promise<any>;
  
  /**
   * Gets information about a specific pull request
   * @param owner Repository owner
   * @param repo Repository name
   * @param pullNumber Pull request number
   * @returns Pull request information
   */
  getPullRequest(owner: string, repo: string, pullNumber: number): Promise<any>;
  
  /**
   * Lists pull requests in a repository
   * @param owner Repository owner
   * @param repo Repository name
   * @param state PR state (open, closed, all)
   * @returns List of pull requests
   */
  listPullRequests(owner: string, repo: string, state?: string): Promise<any[]>;
}

/**
 * Combined interface for all GitHub tools
 */
export interface IGitHubTools extends IGitHubRepoTools, IGitHubIssueTools, IGitHubPRTools {}
