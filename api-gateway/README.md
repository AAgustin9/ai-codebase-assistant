# API Gateway

This is the API Gateway service for the AI Codebase Assistant project. It handles API requests and routes them to the appropriate services.

## Technology Stack

- Ruby on Rails 8.0
- PostgreSQL 14
- Docker

## Docker Setup

### Prerequisites

- Docker and Docker Compose installed on your system
- Git repository cloned locally

### Setting Up the Master Key

The Rails application requires a master key for decrypting credentials. Follow these steps to set up the master key:

1. Create a master key file:

```bash
# Generate a new master key
touch config/master.key
chmod 600 config/master.key
openssl rand -hex 16 > config/master.key
```

2. Create a `.env` file in the project root with the following content:

```
RAILS_MASTER_KEY=your_generated_master_key
AI_ENGINE_URL=http://host.docker.internal:3001
GITHUB_TOKEN=your_github_token_here
DATABASE_URL=postgres://postgres:postgres@db:5432/app_development
```

Replace `your_generated_master_key` with the content of your `config/master.key` file and add your GitHub personal access token.

### Running with Docker

To start the application using Docker:

```bash
# Start the containers
docker compose up -d

# View logs
docker compose logs -f api

# Stop the containers
docker compose down
```

The API will be available at http://localhost:3003.

If you did this coming from the main README, you can go [back](../README.md).

### Database Setup

The database is automatically created and migrated when the Docker container starts. If you need to run migrations manually:

```bash
docker compose exec api bin/rails db:migrate
```

To seed the database:

```bash
docker compose exec api bin/rails db:seed
```

## Development

### Running Tests

```bash
docker compose exec api bin/rails test
```

### Accessing the Rails Console

```bash
docker compose exec api bin/rails console
```

## Troubleshooting

### Key Must Be 16 Bytes Error

If you encounter an error like `key must be 16 bytes (ArgumentError)`, it means your master key is not properly set up. Make sure:

1. The `config/master.key` file exists and contains a valid 16-byte key (32 hex characters)
2. The `RAILS_MASTER_KEY` environment variable is correctly set in your Docker Compose file or `.env` file
3. The credentials file is properly encrypted with the master key

### Database Connection Issues

If the application can't connect to the database, ensure:

1. The database container is running (`docker compose ps`)
2. The database URL in the Docker Compose file is correct
3. Try restarting both containers: `docker compose restart`