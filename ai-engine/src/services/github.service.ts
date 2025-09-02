import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Octokit } from '@octokit/rest';
import { IGitHubTools } from '../interfaces/github-tools.interface';

@Injectable()
export class GitHubService implements IGitHubTools {
  private readonly octokit: Octokit;
  private readonly logger = new Logger(GitHubService.name);

  constructor(private configService: ConfigService) {
    const token = this.configService.get<string>('github.token') || process.env.GITHUB_TOKEN;
    this.logger.log(`[GITHUB-SERVICE] Initializing with token: ${token ? 'Present' : 'Missing'}`);
    
    // Initialize Octokit with auth token from config or environment
    this.octokit = new Octokit({
      auth: token,
      userAgent: 'ai-codebase-assistant/1.0.0',
    });
    
    if (!token) {
      this.logger.warn('[GITHUB-SERVICE] No GitHub token provided - API calls may fail');
      this.logger.warn('[GITHUB-SERVICE] Set GITHUB_TOKEN environment variable or github.token in config');
    } else {
      this.logger.log('[GITHUB-SERVICE] GitHub token configured successfully');
    }
  }

  // Repository operations
  async getRepositoryInfo(owner: string, repo: string): Promise<any> {
    try {
      this.logger.log(`[GITHUB-SERVICE] Getting repository info: ${owner}/${repo}`);
      const { data } = await this.octokit.repos.get({
        owner,
        repo,
      });
      this.logger.log(`[GITHUB-SERVICE] Repository info retrieved successfully`);
      return data;
    } catch (error) {
      this.logger.error(`[GITHUB-SERVICE] Failed to get repository info: ${error.message}`);
      throw new Error(`Failed to get repository info: ${error.message}`);
    }
  }

  async listFiles(owner: string, repo: string, path: string, ref?: string): Promise<any[]> {
    try {
      this.logger.log(`[GITHUB-SERVICE] Listing files: ${owner}/${repo} at path: ${path}${ref ? ` (ref: ${ref})` : ''}`);
      const { data } = await this.octokit.repos.getContent({
        owner,
        repo,
        path,
        ref,
      });
      const fileCount = Array.isArray(data) ? data.length : 1;
      this.logger.log(`[GITHUB-SERVICE] Found ${fileCount} file(s)/directories`);
      return Array.isArray(data) ? data : [data];
    } catch (error) {
      this.logger.error(`[GITHUB-SERVICE] Failed to list files: ${error.message}`);
      throw new Error(`Failed to list files: ${error.message}`);
    }
  }

  async getFileContent(owner: string, repo: string, path: string, ref?: string): Promise<any> {
    try {
      this.logger.log(`[GITHUB-SERVICE] Getting file content: ${owner}/${repo} at path: ${path}${ref ? ` (ref: ${ref})` : ''}`);
      const { data } = await this.octokit.repos.getContent({
        owner,
        repo,
        path,
        ref,
      });

      if (Array.isArray(data)) {
        this.logger.warn(`[GITHUB-SERVICE] Path points to directory, not file: ${path}`);
        throw new Error('Path points to a directory, not a file');
      }

      // If the content is base64 encoded
      if ('content' in data && data.encoding === 'base64') {
        const content = Buffer.from(data.content, 'base64').toString('utf-8');
        this.logger.log(`[GITHUB-SERVICE] File content decoded, size: ${content.length} chars`);
        return {
          ...data,
          decodedContent: content,
        };
      }

      this.logger.log(`[GITHUB-SERVICE] File content retrieved successfully`);
      return data;
    } catch (error) {
      this.logger.error(`[GITHUB-SERVICE] Failed to get file content: ${error.message}`);
      throw new Error(`Failed to get file content: ${error.message}`);
    }
  }

  async writeFile(
    owner: string,
    repo: string,
    path: string,
    content: string,
    message: string,
    branch?: string,
    sha?: string
  ): Promise<any> {
    try {
      this.logger.log(`[GITHUB-SERVICE] Writing file: ${owner}/${repo} at path: ${path}${branch ? ` (branch: ${branch})` : ''}`);
      
      // If no SHA is provided, we need to check if the file exists to get its SHA
      if (!sha) {
        try {
          const fileData = await this.getFileContent(owner, repo, path, branch);
          if (fileData && fileData.sha) {
            sha = fileData.sha;
            this.logger.log(`[GITHUB-SERVICE] File exists, will update with SHA: ${sha?.substring(0, 8)}...`);
          }
        } catch (error) {
          // File doesn't exist, will be created
          this.logger.log(`[GITHUB-SERVICE] File ${path} doesn't exist, will be created`);
        }
      }

      // Create/update the file
      const { data } = await this.octokit.repos.createOrUpdateFileContents({
        owner,
        repo,
        path,
        message,
        content: Buffer.from(content).toString('base64'),
        branch: branch || 'main', // Default to 'main' if no branch is specified
        sha, // SHA is required for updating existing files
      });

      this.logger.log(`[GITHUB-SERVICE] File written successfully: ${data.commit.html_url}`);
      return data;
    } catch (error) {
      this.logger.error(`[GITHUB-SERVICE] Failed to write file: ${error.message}`);
      throw new Error(`Failed to write file: ${error.message}`);
    }
  }

  // Issue operations
  async createIssue(
    owner: string, 
    repo: string, 
    title: string, 
    body: string, 
    labels?: string[]
  ): Promise<any> {
    try {
      const { data } = await this.octokit.issues.create({
        owner,
        repo,
        title,
        body,
        labels,
      });
      return data;
    } catch (error) {
      throw new Error(`Failed to create issue: ${error.message}`);
    }
  }

  async listIssues(
    owner: string, 
    repo: string, 
    state: string = 'open', 
    labels?: string[]
  ): Promise<any[]> {
    try {
      const { data } = await this.octokit.issues.listForRepo({
        owner,
        repo,
        state: state as 'open' | 'closed' | 'all',
        labels: labels?.join(','),
      });
      return data;
    } catch (error) {
      throw new Error(`Failed to list issues: ${error.message}`);
    }
  }

  async getIssue(owner: string, repo: string, issueNumber: number): Promise<any> {
    try {
      const { data } = await this.octokit.issues.get({
        owner,
        repo,
        issue_number: issueNumber,
      });
      return data;
    } catch (error) {
      throw new Error(`Failed to get issue: ${error.message}`);
    }
  }

  // Pull request operations
  async createPullRequest(
    owner: string,
    repo: string,
    title: string,
    body: string,
    head: string,
    base: string
  ): Promise<any> {
    try {
      const { data } = await this.octokit.pulls.create({
        owner,
        repo,
        title,
        body,
        head,
        base,
      });
      return data;
    } catch (error) {
      throw new Error(`Failed to create pull request: ${error.message}`);
    }
  }

  async getPullRequest(owner: string, repo: string, pullNumber: number): Promise<any> {
    try {
      const { data } = await this.octokit.pulls.get({
        owner,
        repo,
        pull_number: pullNumber,
      });
      return data;
    } catch (error) {
      throw new Error(`Failed to get pull request: ${error.message}`);
    }
  }

  async listPullRequests(owner: string, repo: string, state: string = 'open'): Promise<any[]> {
    try {
      const { data } = await this.octokit.pulls.list({
        owner,
        repo,
        state: state as 'open' | 'closed' | 'all',
      });
      return data;
    } catch (error) {
      throw new Error(`Failed to list pull requests: ${error.message}`);
    }
  }
}
