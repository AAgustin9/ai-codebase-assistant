import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';
import { cohere } from '@ai-sdk/cohere';
import { mistral } from '@ai-sdk/mistral';
import { MockProvider } from './mock-provider';
import { Logger } from '@nestjs/common';

const logger = new Logger('ModelProvider');

/**
 * Helper function to determine the appropriate model provider based on the model name
 * @param modelName The name of the model to use
 * @param apiKey Optional API key to use for the model provider
 * @returns The configured model provider
 */
export function getModelProvider(modelName: string, apiKey?: string): any {
  // Check if we're in test mode
  if (process.env.NODE_ENV === 'test' || process.env.AI_USE_MOCK === 'true') {
    logger.log('[MODEL-PROVIDER] Using mock model for testing');
    return new MockProvider(modelName);
  }
  
  // Check for specific provider models
  try {
    // OpenAI models
    if (modelName.startsWith('gpt-') || modelName.includes('openai')) {
      const openaiApiKey = apiKey || process.env.OPENAI_API_KEY;
      if (!openaiApiKey) {
        logger.warn('[MODEL-PROVIDER] OpenAI API key not provided, using mock provider');
        return new MockProvider(modelName);
      }
      logger.log('[MODEL-PROVIDER] Using OpenAI provider');
      // Set the API key in process.env temporarily if provided
      const originalKey = process.env.OPENAI_API_KEY;
      if (apiKey) process.env.OPENAI_API_KEY = apiKey;
      const provider = openai(modelName);
      // Restore original key
      if (apiKey) process.env.OPENAI_API_KEY = originalKey;
      return provider;
    }
    
    // Anthropic models
    if (modelName.startsWith('claude-') || modelName.includes('anthropic')) {
      const anthropicApiKey = apiKey || process.env.ANTHROPIC_API_KEY;
      if (!anthropicApiKey) {
        logger.warn('[MODEL-PROVIDER] Anthropic API key not provided, using mock provider');
        return new MockProvider(modelName);
      }
      logger.log('[MODEL-PROVIDER] Using Anthropic provider');
      // Set the API key in process.env temporarily if provided
      const originalKey = process.env.ANTHROPIC_API_KEY;
      if (apiKey) process.env.ANTHROPIC_API_KEY = apiKey;
      const provider = anthropic(modelName);
      // Restore original key
      if (apiKey) process.env.ANTHROPIC_API_KEY = originalKey;
      return provider;
    }
    
    // Cohere models
    if (modelName.startsWith('command-') || modelName.includes('cohere')) {
      const cohereApiKey = apiKey || process.env.COHERE_API_KEY;
      if (!cohereApiKey) {
        logger.warn('[MODEL-PROVIDER] Cohere API key not provided, using mock provider');
        return new MockProvider(modelName);
      }
      logger.log('[MODEL-PROVIDER] Using Cohere provider');
      // Set the API key in process.env temporarily if provided
      const originalKey = process.env.COHERE_API_KEY;
      if (apiKey) process.env.COHERE_API_KEY = apiKey;
      const provider = cohere(modelName);
      // Restore original key
      if (apiKey) process.env.COHERE_API_KEY = originalKey;
      return provider;
    }
    
    // Mistral models
    if (modelName.startsWith('mistral-') || modelName.includes('mistral')) {
      const mistralApiKey = apiKey || process.env.MISTRAL_API_KEY;
      if (!mistralApiKey) {
        logger.warn('[MODEL-PROVIDER] Mistral API key not provided, using mock provider');
        return new MockProvider(modelName);
      }
      logger.log('[MODEL-PROVIDER] Using Mistral provider');
      // Set the API key in process.env temporarily if provided
      const originalKey = process.env.MISTRAL_API_KEY;
      if (apiKey) process.env.MISTRAL_API_KEY = apiKey;
      const provider = mistral(modelName);
      // Restore original key
      if (apiKey) process.env.MISTRAL_API_KEY = originalKey;
      return provider;
    }
    
    // Default to mock provider if no specific provider is detected
    logger.warn('[MODEL-PROVIDER] No specific provider detected, using mock provider');
    return new MockProvider(modelName);
  } catch (error) {
    logger.error(`[MODEL-PROVIDER] Error creating provider: ${error.message}`, error.stack);
    return new MockProvider(modelName);
  }
}
