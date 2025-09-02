// Simple test script for the AI Engine API
const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3000';

async function testGenerateText() {
  console.log('Testing /ai/generate endpoint...');
  
  try {
    const response = await fetch(`${BASE_URL}/ai/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: 'Hello, can you tell me about SOLID principles?',
        options: {
          model: 'gpt-4o' // Example model, will be replaced by the service with the configured default if needed
        }
      }),
    });
    
    const data = await response.json();
    console.log('Response:', data);
    console.log('Test completed successfully!');
  } catch (error) {
    console.error('Error testing /ai/generate:', error.message);
  }
}

async function testGenerateTextWithTools() {
  console.log('Testing /ai/generate-with-tools endpoint...');
  
  try {
    const response = await fetch(`${BASE_URL}/ai/generate-with-tools`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: 'Can you get information about the nestjs/nest repository?',
        options: {
          model: 'gpt-4o' // Example model, will be replaced by the service with the configured default if needed
        }
      }),
    });
    
    const data = await response.json();
    console.log('Response:', data);
    console.log('Test completed successfully!');
  } catch (error) {
    console.error('Error testing /ai/generate-with-tools:', error.message);
  }
}

async function runTests() {
  await testGenerateText();
  console.log('\n-----------------------------------\n');
  await testGenerateTextWithTools();
}

runTests();
