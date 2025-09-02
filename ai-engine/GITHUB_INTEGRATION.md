# GitHub Integration Guide

The AI Engine now includes comprehensive GitHub integration that allows the AI to read, write, and manage GitHub repositories using the `GITHUB_TOKEN` environment variable.

## Setup

1. **Get a GitHub Personal Access Token:**
   - Go to GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)
   - Generate a new token with the following scopes:
     - `repo` (Full control of private repositories)
     - `public_repo` (Access public repositories)
     - `read:user` (Read user profile data)
     - `user:email` (Access user email addresses)

2. **Set the Environment Variable:**
   ```bash
   export GITHUB_TOKEN=ghp_your_actual_token_here
   ```

3. **Or add to your `.env` file:**
   ```
   GITHUB_TOKEN=ghp_your_actual_token_here
   ```

## Available GitHub Tools

The AI can now use these GitHub operations:

### 1. Repository Information
- **Tool:** `getRepositoryInfo`
- **Purpose:** Get basic information about a repository
- **Example:** "Get information about the repository AAgustin9/wordleRick"

### 2. File Operations
- **Tool:** `listFiles`
- **Purpose:** List files and directories in a repository
- **Example:** "List all files in the /app directory of AAgustin9/wordleRick"

- **Tool:** `readFile`
- **Purpose:** Read the content of a specific file
- **Example:** "Read the package.json file from AAgustin9/wordleRick"

- **Tool:** `writeFile`
- **Purpose:** Create or update files in a repository
- **Example:** "Create a new README.md file with project documentation"

### 3. Issue Management
- **Tool:** `createIssue`
- **Purpose:** Create new issues in a repository
- **Example:** "Create an issue about fixing the login bug"

- **Tool:** `listIssues`
- **Purpose:** List existing issues
- **Example:** "Show me all open issues in the repository"

### 4. Pull Request Management
- **Tool:** `createPullRequest`
- **Purpose:** Create pull requests
- **Example:** "Create a pull request to merge feature-branch into main"

## Usage Examples

### Example 1: Explore a Repository
```
Prompt: "List all files in the root directory of AAgustin9/wordleRick repository and then read the README.md file if it exists"
```

### Example 2: Create Documentation
```
Prompt: "Read the package.json file from AAgustin9/wordleRick and create a comprehensive README.md file based on the project information"
```

### Example 3: File Management
```
Prompt: "Create a new file called 'CONTRIBUTING.md' in AAgustin9/wordleRick with guidelines for contributors"
```

### Example 4: Issue Tracking
```
Prompt: "Create an issue in AAgustin9/wordleRick titled 'Add error handling' with a description about improving error handling in the application"
```

## Testing the Integration

1. **Test with a valid token:**
   ```bash
   export GITHUB_TOKEN=your_actual_github_token
   node test-github-direct.js
   ```

2. **Test with AI Engine:**
   ```bash
   curl -X POST -H "Content-Type: application/json" \
     --data '{"prompt":"List files in GitHub repo owner AAgustin9, repo wordleRick, at path /app","options":{"model":"gpt-4o"}}' \
     http://localhost:3001/api/v1/ai/generate-with-tools
   ```

## Error Handling

The service includes comprehensive error handling:
- **401 Unauthorized:** Invalid or missing GitHub token
- **404 Not Found:** Repository or file doesn't exist
- **403 Forbidden:** Insufficient permissions or rate limit exceeded
- **Network errors:** Connection issues with GitHub API

## Security Notes

- Never commit your actual GitHub token to version control
- Use environment variables or secure configuration management
- Regularly rotate your GitHub tokens
- Use minimal required permissions for your use case

## Troubleshooting

1. **"Bad credentials" error:**
   - Verify your GITHUB_TOKEN is correct
   - Check if the token has expired
   - Ensure the token has the required scopes

2. **"Repository not found" error:**
   - Verify the repository owner and name are correct
   - Check if the repository is private and your token has access
   - Ensure the repository exists

3. **"Insufficient permissions" error:**
   - Check if your token has the required scopes
   - Verify you have write access to the repository (for write operations)

## API Endpoints

- **POST** `/api/v1/ai/generate-with-tools` - Generate text with GitHub tools
- **POST** `/api/v1/ai/generate` - Generate text without tools

The GitHub integration is now fully functional and ready to use with a valid GitHub Personal Access Token!
