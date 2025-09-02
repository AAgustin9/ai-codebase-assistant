#!/bin/bash

# Test script for AI Engine API using curl

BASE_URL="http://localhost:3000"

echo "Testing /ai/generate endpoint..."
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Hello, can you tell me about SOLID principles?",
    "options": {}
  }' \
  $BASE_URL/ai/generate

echo -e "\n\n-----------------------------------\n"

echo "Testing /ai/generate-with-tools endpoint..."
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Can you get information about the nestjs/nest repository?",
    "options": {}
  }' \
  $BASE_URL/ai/generate-with-tools
