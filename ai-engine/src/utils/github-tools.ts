// Using plain JSON schema definitions for tools
import { createTool, createToolSet } from './tool-definition';
import { GitHubService } from '../services/github.service';

// Create a GitHub service instance for tool execution
const githubService = new GitHubService();

/**
 * GitHub tools for AI integration
 */
export const githubTools = createToolSet(
  // List files in a repository
  createTool(
    'listRepositoryFiles',
    'List files in a GitHub repository directory',
    {
      type: 'object',
      properties: {
        owner: { type: 'string', description: 'Repository owner (username)' },
        repo: { type: 'string', description: 'Repository name' },
        path: { type: 'string', description: 'Directory path within the repository', default: '' },
        ref: { type: 'string', description: 'Branch or commit SHA' }
      },
      required: ['owner', 'repo']
    }
  ),
  // Get file content from a repository
  createTool(
    'getRepositoryFileContent',
    'Get the content of a file from a GitHub repository',
    {
      type: 'object',
      properties: {
        owner: { type: 'string', description: 'Repository owner (username)' },
        repo: { type: 'string', description: 'Repository name' },
        path: { type: 'string', description: 'File path within the repository' },
        ref: { type: 'string', description: 'Branch or commit SHA' }
      },
      required: ['owner', 'repo', 'path']
    }
  ),
  // Get repository information
  createTool(
    'getRepositoryInfo',
    'Get information about a GitHub repository',
    {
      type: 'object',
      properties: {
        owner: { type: 'string', description: 'Repository owner (username)' },
        repo: { type: 'string', description: 'Repository name' }
      },
      required: ['owner', 'repo']
    }
  ),
  // Create or update a file in a repository
  createTool(
    'upsertFile',
    'Create or update a file in a GitHub repository',
    {
      type: 'object',
      properties: {
        owner: { type: 'string', description: 'Repository owner (username)' },
        repo: { type: 'string', description: 'Repository name' },
        path: { type: 'string', description: 'File path within the repository' },
        content: { type: 'string', description: 'File content, UTF-8 encoded' },
        message: { type: 'string', description: 'Commit message' },
        branch: { type: 'string', description: 'Branch name', default: 'main' },
        expectedSha: { type: 'string', description: 'Expected SHA for updates (optimistic concurrency)' },
        author: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            email: { type: 'string' }
          }
        },
        committer: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            email: { type: 'string' }
          }
        }
      },
      required: ['owner', 'repo', 'path', 'content', 'message']
    }
  )
);

