import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { generateText } from 'ai';
import { IAiService } from '../interfaces/ai-service.interface';
import { getModelProvider } from '../utils/model-provider';

@Injectable()
export class AiService implements IAiService {
  private readonly logger = new Logger(AiService.name);
  private readonly defaultModel: string;
  
  constructor(private configService: ConfigService) {
    this.defaultModel = this.configService.get<string>('ai.defaultModel') || 'gpt-4o';
    this.logger.log(`[AI-SERVICE] Initialized with default model: ${this.defaultModel}`);
  }

  /**
   * Generates text using the specified LLM
   * @param prompt The prompt to send to the LLM
   * @param options Optional configuration for the LLM
   * @returns The generated text response
   */
  async generateText(prompt: string, options?: Record<string, any>): Promise<string> {
    try {
      // Get the model name and determine the appropriate provider
      const modelName = options?.model || this.defaultModel;
      // Resolve API key from request options first, then config/env
      const modelApiKey =
        this.configService.get<string>('ai.openaiApiKey') ||
        process.env.OPENAI_API_KEY;
      
      this.logger.log(`[AI-SERVICE] Generating text with model: ${modelName}`);
      this.logger.log(`[AI-SERVICE] Prompt length: ${prompt?.length || 0} characters`);
      this.logger.log(`[AI-SERVICE] API Key provided: ${modelApiKey ? 'Yes' : 'No'}`);
      
      const startTime = Date.now();
      this.logger.log(`[AI-SERVICE] Getting model provider`);
      const modelProvider = getModelProvider(modelName, modelApiKey);
      
      this.logger.log(`[AI-SERVICE] Calling AI provider for text generation`);
      const { model: _omitModel, openaiApiKey: _omitKey, ...safeOptions } = options || {};
      // Replace prompt field with messages array
      const result = await generateText({
        model: modelProvider,
        messages: [{ role: 'user', content: prompt }],
        ...safeOptions,
      });

      const duration = Date.now() - startTime;
      this.logger.log(`[AI-SERVICE] Text generation completed in ${duration}ms`);
      this.logger.log(`[AI-SERVICE] Response length: ${result.text?.length || 0} characters`);
      
      return result.text;
    } catch (error) {
      this.logger.error(`[AI-SERVICE] Failed to generate text: ${error.message}`, error.stack);
      throw new Error(`Failed to generate text: ${error.message}`);
    }
  }

    /**
   * Generates text with tool usage capabilities
   * @param prompt The prompt to send to the LLM
   * @param tools Array of tools available to the LLM
   * @param options Optional configuration for the LLM
   * @returns The generated text response and any tool calls made
   */
    async generateTextWithTools(
      prompt: string,
      tools: Record<string, any>,
      options?: Record<string, any>
    ): Promise<{ text: string; toolCalls: any[] }> {
      try {
        // Get the model name and determine the appropriate provider
        const modelName = options?.model || this.defaultModel;
        const modelApiKey =
          this.configService.get<string>('ai.openaiApiKey') ||
          process.env.OPENAI_API_KEY;
  
        this.logger.log(`[AI-SERVICE] Generating text with tools using model: ${modelName}`);
        this.logger.log(`[AI-SERVICE] Prompt length: ${prompt?.length || 0} characters`);
        this.logger.log(`[AI-SERVICE] API Key provided: ${modelApiKey ? 'Yes' : 'No'}`);
        this.logger.log(`[AI-SERVICE] Available tools: ${Object.keys(tools || {}).length}`);
  
        const startTime = Date.now();
        const modelProvider = getModelProvider(modelName, modelApiKey);
  
        // Normalize tool schemas: enforce type:"object" if missing
        const toolSet: Record<string, any> = {};
        for (const [name, tool] of Object.entries(tools || {})) {
          this.logger.log(`[AI-SERVICE] Processing tool ${name}: ${JSON.stringify(tool)}`);
          toolSet[name] = {
            description: (tool as any).description || `Tool: ${name}`,
            // Use the stored JSON schema parameters
            parameters: (tool as any).parameters || {
              type: "object",
              properties: {}
            },
            execute: (tool as any).execute,
          };
        }
  
        this.logger.log(`[AI-SERVICE] Using tools: ${JSON.stringify(Object.keys(toolSet))}`);
        this.logger.log(`[AI-SERVICE] Tool set structure: ${JSON.stringify(toolSet, null, 2)}`);
  
        const { model: _omitModel2, openaiApiKey: _omitKey2, ...safeOptions2 } = options || {};
        const result = await generateText({
          model: modelProvider,
          messages: [{ role: 'user', content: prompt }],
          tools: toolSet,
          ...safeOptions2,
        });
  
        const duration = Date.now() - startTime;
        this.logger.log(`[AI-SERVICE] Text generation with tools completed in ${duration}ms`);
        this.logger.log(`[AI-SERVICE] Response: text length=${result.text?.length || 0}, tool calls=${result.toolCalls?.length || 0}`);
  
        if (result.toolCalls?.length) {
          const toolNames = (result.toolCalls as any[]).map(tc => tc?.name ?? 'unknown');
          this.logger.log(`[AI-SERVICE] Tool calls requested: ${toolNames.join(', ')}`);
        }
  
        return {
          text: result.text,
          toolCalls: result.toolCalls || [],
        };
      } catch (error) {
        this.logger.error(`[AI-SERVICE] Failed to generate text with tools: ${error.message}`, error.stack);
        throw new Error(`Failed to generate text with tools: ${error.message}`);
      }
    }
  
}
