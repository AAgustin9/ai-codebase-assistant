import { Controller, Post, Body, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { AiService } from '../services/ai.service';
import { GitHubService } from '../services/github.service';
import { GenerateTextDto, GenerateTextWithToolsDto } from '../interfaces/dto/ai.dto';

@Controller('ai')
export class AiController {
  private readonly logger = new Logger(AiController.name);

  constructor(
    private readonly aiService: AiService,
    private readonly githubService: GitHubService,
  ) {}

  @Post('generate')
  async generateText(@Body() dto: GenerateTextDto) {
    this.logger.log(`[AI-ENGINE] Received generate text request: model=${dto.options?.model || 'default'}, prompt length=${dto.prompt?.length || 0}`);
    
    try {
      const startTime = Date.now();
      this.logger.log(`[AI-ENGINE] Calling AI service to generate text`);
      
      const result = await this.aiService.generateText(dto.prompt, dto.options);
      
      const duration = Date.now() - startTime;
      this.logger.log(`[AI-ENGINE] Text generation completed in ${duration}ms, response length=${result?.length || 0}`);
      
      return { result };
    } catch (error) {
      this.logger.error(`[AI-ENGINE] Failed to generate text: ${error.message}`, error.stack);
      throw new HttpException(
        `Failed to generate text: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('generate-with-tools')
  async generateTextWithTools(@Body() dto: GenerateTextWithToolsDto) {
    this.logger.log(`[AI-ENGINE] Received generate text with tools request: model=${dto.options?.model || 'default'}, prompt length=${dto.prompt?.length || 0}`);
    
    try {
      // Simple GitHub integration - parse prompt for GitHub operations
      const prompt = dto.prompt.toLowerCase();
      
      if (prompt.includes('list files') && prompt.includes('github repo')) {
        this.logger.log(`[AI-ENGINE] Detected GitHub list files request`);
        
        // Extract repository info from prompt - handle the exact format
        // Format: "List files in GitHub repo owner AAgustin9, repo wordleRick, at path /app"
        const ownerMatch = prompt.match(/owner\s+([a-zA-Z0-9_-]+)/);
        const repoMatch = prompt.match(/repo\s+([a-zA-Z0-9_-]+)/);
        const pathMatch = prompt.match(/path\s+([^\s]+)/);
        
        this.logger.log(`[AI-ENGINE] Original prompt: ${dto.prompt}`);
        this.logger.log(`[AI-ENGINE] Parsed: owner=${ownerMatch?.[1]}, repo=${repoMatch?.[1]}, path=${pathMatch?.[1]}`);
        
        // Debug: show what the regex is actually matching
        this.logger.log(`[AI-ENGINE] Full regex matches: owner=${ownerMatch}, repo=${repoMatch}, path=${pathMatch}`);
        
        // Fix: The second "repo" match is picking up "owner" - let's be more specific
        const betterRepoMatch = prompt.match(/repo\s+([a-zA-Z0-9_-]+)(?=,|$)/);
        this.logger.log(`[AI-ENGINE] Better repo match: ${betterRepoMatch?.[1]}`);
        
        if (ownerMatch && betterRepoMatch) {
          const owner = ownerMatch[1];
          const repo = betterRepoMatch[1];
          const path = pathMatch ? pathMatch[1] : '/';
          
          this.logger.log(`[AI-ENGINE] GitHub operation: listFiles(${owner}, ${repo}, ${path})`);
          
          try {
            const files = await this.githubService.listFiles(owner, repo, path);
            
            const fileList = files.map((file: any) => ({
              name: file.name,
              path: file.path,
              type: file.type,
              size: file.size || 0,
            }));
            
            return {
              text: `Found ${fileList.length} items in ${owner}/${repo} at path ${path}:\n\n${fileList.map(f => `- ${f.name} (${f.type})`).join('\n')}`,
              toolResults: [{
                toolName: 'listFiles',
                result: fileList,
              }],
            };
          } catch (error: any) {
            return {
              text: `Error accessing GitHub repository ${owner}/${repo}: ${error.message}`,
              toolResults: [{
                toolName: 'listFiles',
                error: error.message,
              }],
            };
          }
        }
      }
      
      // Fallback to regular text generation
      this.logger.log(`[AI-ENGINE] No GitHub operations detected, using regular generation`);
      const result = await this.aiService.generateText(dto.prompt, dto.options);
      
      return { 
        text: result,
        toolResults: [],
      };
    } catch (error) {
      this.logger.error(`[AI-ENGINE] Failed to generate text with tools: ${error.message}`, error.stack);
      throw new HttpException(
        `Failed to generate text with tools: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
