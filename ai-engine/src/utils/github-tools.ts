import { z } from 'zod';
import { createTool, createToolSet } from './tool-definition';

/**
 * GitHub tools for AI integration
 */
export const githubTools = createToolSet(
  // List files in a repository
  createTool(
    'listRepositoryFiles',
    'List files in a GitHub repository directory',
    z.object({
      owner: z.string().describe('Repository owner (username)'),
      repo: z.string().describe('Repository name'),
      path: z.string().default('').describe('Directory path within the repository'),
      ref: z.string().optional().describe('Branch or commit SHA')
    })
  ),
  
  // Get file content from a repository
  createTool(
    'getRepositoryFileContent',
    'Get the content of a file from a GitHub repository',
    z.object({
      owner: z.string().describe('Repository owner (username)'),
      repo: z.string().describe('Repository name'),
      path: z.string().describe('File path within the repository'),
      ref: z.string().optional().describe('Branch or commit SHA')
    })
  ),
  
  // Get repository information
  createTool(
    'getRepositoryInfo',
    'Get information about a GitHub repository',
    z.object({
      owner: z.string().describe('Repository owner (username)'),
      repo: z.string().describe('Repository name')
    })
  )
);

