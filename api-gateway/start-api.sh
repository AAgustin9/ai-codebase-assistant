#!/bin/bash

# Set environment variables
export DATABASE_URL=postgres://postgres:postgres@localhost:5432/app_development
export RAILS_ENV=development
export SECRET_KEY_BASE=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6

# Start Rails server
cd /Users/agussoul/projects/sirius/ai-codebase-assistant/api-gateway
bundle install
bundle exec rails db:create db:migrate
bundle exec rails server -b 0.0.0.0 -p 3000

