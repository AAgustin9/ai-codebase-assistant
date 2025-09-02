# AI Engine Service

This internal service is the brain of the operation, handling all AI logic and third-party integrations.

## Features

- Receives requests from the Ruby Gateway
- Uses the Vercel AI SDK to manage interactions with various LLM providers
- Implements GitHub interaction tools
- Integrates with the GitHub API using Octokit.js
- Supports multiple AI providers (OpenAI, Anthropic, Cohere, Mistral)

## Architecture

The service follows SOLID principles:

- **Single Responsibility**: Each class has a single responsibility
- **Open/Closed**: The system is open for extension but closed for modification
- **Liskov Substitution**: Interfaces are designed for proper substitution
- **Interface Segregation**: Specific interfaces for different functionalities
- **Dependency Inversion**: Dependencies are injected and rely on abstractions

## Getting Started

### Prerequisites

- Node.js (v18+ recommended)
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy the environment example file:
   ```bash
   cp env.example .env
   ```
4. Update the `.env` file with your API keys and configuration

### Running the Service

Development mode:
```bash
npm run start:dev
```

Production mode:
```bash
npm run build
npm run start:prod
```

## API Endpoints

### Generate Text

```
POST /ai/generate
```

Request body:
```json
{
  "prompt": "Your prompt text here",
  "options": {
    "model": "gpt-4o"
  }
}
```

### Generate Text with GitHub Tools

```
POST /ai/generate-with-tools
```

Request body:
```json
{
  "prompt": "Your prompt text here",
  "options": {
    "model": "gpt-4o"
  }
}
```

## Environment Variables

- `DEFAULT_AI_MODEL`: Default LLM model to use (e.g., "gpt-4o", "claude-3-opus", "command-r", "mistral-large")
- `GITHUB_TOKEN`: GitHub personal access token
- `PORT`: Server port (default: 3000)

### AI Provider API Keys (set the ones you need)

- `OPENAI_API_KEY`: Your OpenAI API key
- `ANTHROPIC_API_KEY`: Your Anthropic API key
- `COHERE_API_KEY`: Your Cohere API key
- `MISTRAL_API_KEY`: Your Mistral API key

## Testing

You can run the service in mock mode by setting:
```
AI_USE_MOCK=true
```

This will use mock providers instead of making actual API calls, which is useful for testing.

## Project Structure

```
ai-engine/
├── src/
│   ├── config/           # Configuration files
│   ├── controllers/      # API controllers
│   ├── interfaces/       # Interfaces and DTOs
│   ├── modules/          # NestJS modules
│   ├── services/         # Service implementations
│   ├── utils/            # Utility functions
│   ├── app.controller.ts # Main app controller
│   ├── app.module.ts     # Main app module
│   ├── app.service.ts    # Main app service
│   └── main.ts           # Application entry point
├── test/                 # Test files
└── README.md             # This file
```