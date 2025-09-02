import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AiService } from './services/ai.service';
import { GitHubService } from './services/github.service';
import { ConfigService } from '@nestjs/config';

/**
 * Simple test script to verify the AI Engine service functionality
 */
async function runTest() {
  try {
    console.log('Creating test application...');
    
    // Create a NestJS application
    const app = await NestFactory.create(AppModule, {
      logger: ['error', 'warn'], // Reduce logging noise
    });
    
    // Get the services
    const aiService = app.get(AiService);
    const githubService = app.get(GitHubService);
    const configService = app.get(ConfigService);
    
    console.log('Testing services...');
    
    // Test GitHub service
    console.log('1. Testing GitHub service:');
    try {
      const token = configService.get('github.token');
      console.log(`   - GitHub token configured: ${token ? 'Yes' : 'No'}`);
      
      if (token) {
        console.log('   - Attempting to get a public repository info...');
        const repoInfo = await githubService.getRepositoryInfo('nestjs', 'nest');
        console.log(`   - Repository info retrieved: ${repoInfo ? 'Success' : 'Failed'}`);
      } else {
        console.log('   - Skipping GitHub API test (no token configured)');
      }
    } catch (error) {
      console.error('   - GitHub service test failed:', error.message);
    }
    
    // Test AI service without tools
    console.log('\n2. Testing AI service (without tools):');
    try {
      const defaultModel = configService.get('ai.defaultModel');
      console.log(`   - Default AI model configured: ${defaultModel || 'Not set'}`);
      
      // Skip the actual API call if no API keys are configured
      console.log('   - Note: Skipping actual API call (would require API keys)');
      console.log('   - AI service initialized successfully');
    } catch (error) {
      console.error('   - AI service test failed:', error.message);
    }
    
    console.log('\nAll tests completed!');
    
    // Close the application
    await app.close();
    
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

// Run the test
runTest();
