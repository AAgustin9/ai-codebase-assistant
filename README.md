# AI Codebase Assistant

A powerful AI-based codebase assistant that helps developers interact with GitHub repositories:

1. **Frontend**: Next.js application with a chat interface powered by Vercel AI SDK
2. **API Gateway**: Ruby on Rails service handling authentication, logging, and routing
3. **AI Engine**: NestJS service integrating with LLMs and the GitHub API

## Architecture Overview

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌──────────┐
│   Frontend  │────▶│ API Gateway │────▶│  AI Engine  │────▶│  GitHub  │
│   (Next.js) │     │   (Rails)   │     │  (NestJS)   │     │   API    │
│  Port 3000  │     │  Port 3003  │     │  Port 3001  │     │          │
└─────────────┘     └─────────────┘     └─────────────┘     └──────────┘
                          │
                          ▼
                    ┌──────────┐
                    │ Database │
                    │(Postgres)│
                    │Port 5432 │
                    └──────────┘
```

### Service Communication

- **Frontend** (Next.js): Runs on port 3000 and communicates with the API Gateway
- **API Gateway** (Rails): Runs on port 3003 and forwards requests to the AI Engine
- **AI Engine** (NestJS): Runs on port 3001 and interacts with the GitHub API
- **Database** (PostgreSQL): Runs on port 5432 and is used by the API Gateway

## Features

- **Chat Interface**: Conversational UI for interacting with GitHub repositories
- **GitHub Tools**:
  - `listFiles`: List files and directories in a repository
  - `readFile`: Read the content of a specific file 
  - `writeFile`: Create or update files with commit messages
- **Generative UI**: Dynamic rendering of repository content with syntax highlighting
- **Analytics Dashboard**: Visualize usage data and performance metrics
- **Multi-Model Support**: Compatible with OpenAI (GPT), Anthropic (Claude), and Google (Gemini) models

## Setup Instructions

### Prerequisites

- Node.js 18+ for Frontend and AI Engine
- Ruby 3.2+ and Rails 7.1+ for API Gateway
- PostgreSQL 14+ for the API Gateway database
- Git

### Frontend (Next.js)

1. Navigate to the frontend directory:
   ```
   cd frontend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env.local` file based on `.env.example`:
   ```
   cp .env.example .env.local
   ```

4. Start the development server:
   ```
   npm run dev
   ```

### API Gateway (Ruby on Rails)

1. A docker container is used for this, check out the other readme in the api-gateway folder [here](/api-gateway/README.md)

### AI Engine (NestJS)

1. Navigate to the AI Engine directory:
   ```
   cd ai-engine
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file based on `.env.example`:
   ```
   cp .env.example .env
   ```

4. Start the development server:
   ```
   npm run start:dev
   ```

## API Usage

### Authentication

All API requests require an API key, which should be included in the `X-API-Key` header.

### Example cURL command

```bash
curl -X POST "http://localhost:3003/api/v1/chat" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your_api_key_here" \
  -d '{
    "prompt": "Show me the files in the src directory of the react repository",
    "model": "gpt-4o",
    "tools": [
      {
        "type": "function",
        "function": {
          "name": "listFiles",
          "description": "Lists files in a repository directory",
          "parameters": {
            "type": "object",
            "properties": {
              "owner": {
                "type": "string",
                "description": "Repository owner"
              },
              "repo": {
                "type": "string",
                "description": "Repository name"
              },
              "path": {
                "type": "string",
                "description": "Directory path"
              }
            },
            "required": ["owner", "repo", "path"]
          }
        }
      }
    ]
  }'
```