import { registerAs } from '@nestjs/config';

export default registerAs('ai', () => ({
  defaultModel: process.env.DEFAULT_AI_MODEL || 'gpt-4o',
  // Default OpenAI API key (used if request doesn't provide one)
  openaiApiKey: process.env.OPENAI_API_KEY || undefined,
}));
