#!/bin/bash

# Test script for AI Engine API using curl

echo "Testing AI Engine API..."
echo "========================"

# Test the generate endpoint
echo -e "\n1. Testing /ai/generate endpoint..."
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Hello, can you tell me about SOLID principles?",
    "options": {
      "model": "gpt-4o"
    }
  }' \
  http://localhost:3000/ai/generate

echo -e "\n\n2. Testing /ai/generate-with-tools endpoint..."
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Can you get information about the nestjs/nest repository?",
    "options": {
      "model": "gpt-4o"
    }
  }' \
  http://localhost:3000/ai/generate-with-tools

echo -e "\n\nTests completed!"
