// ai.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  HttpException,
  HttpStatus,
  Logger,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { AiService } from '../services/ai.service';
import { GitHubService } from '../services/github.service';
import { GenerateTextDto, GenerateTextWithToolsDto } from '../interfaces/dto/ai.dto';
import {
  ListFilesQueryDto,
  GetContentQueryDto,
  UpsertFileDto,
  DeleteFileDto,
  ListTreeQueryDto,
} from '../interfaces/dto/github.dto';
import { githubTools } from '../utils/github-tools';

@Controller('ai')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class AiController {
  private readonly logger = new Logger(AiController.name);

  constructor(
    private readonly aiService: AiService,
    private readonly githubService: GitHubService,
  ) {}

  // ---------- IA ----------
  @Post('generate')
  async generateText(@Body() dto: GenerateTextDto) {
    try {
      const start = Date.now();
      const result = await this.aiService.generateText(dto.prompt, dto.options);
      return {
        result,
        toolResults: [],
        meta: { durationMs: Date.now() - start },
      };
    } catch (error: any) {
      this.logger.error(`generateText failed: ${error.message}`, error.stack);
      throw new HttpException(
        `Failed to generate text: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('generate-with-tools')
  async generateTextWithTools(@Body() dto: GenerateTextWithToolsDto) {
    try {
      const start = Date.now();
      const result = await this.aiService.generateTextWithTools(dto.prompt, githubTools, dto.options);
      return {
        result: result.text,
        toolResults: result.toolCalls ?? [],
        meta: { durationMs: Date.now() - start },
      };
    } catch (error: any) {
      this.logger.error(`generateTextWithTools failed: ${error.message}`, error.stack);
      throw new HttpException(
        `Failed to generate text with tools: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // ---------- GitHub: READ/LIST ----------
  /**
   * Lista archivos/directorios de un path usando prompt para extraer parámetros.
   * POST /ai/github/files
   */
  @Post('github/files')
  async listRepositoryFilesFromPrompt(@Body() dto: GenerateTextDto) {
    try {
      const start = Date.now();
      
      // Use AI to extract repository information from the prompt
      const result = await this.aiService.generateTextWithTools(dto.prompt, githubTools, dto.options);
      
      // Find the listRepositoryFiles tool call
      const listFilesCall = result.toolCalls?.find((call: any) => call.name === 'listRepositoryFiles');
      
      if (!listFilesCall) {
        throw new HttpException(
          'Could not extract repository information from prompt. Please specify owner, repo, and optionally path and ref.',
          HttpStatus.BAD_REQUEST,
        );
      }

      const { owner, repo, path = '/', ref = 'main' } = listFilesCall.args;
      
      if (!owner || !repo) {
        throw new HttpException(
          'Missing required parameters: owner and repo must be specified in the prompt.',
          HttpStatus.BAD_REQUEST,
        );
      }

      // Call the GitHub service with extracted parameters
      const files = await this.githubService.listFiles(owner, repo, path, ref);
      const items = files.map((f: any) => ({
        name: f.name,
        path: f.path,
        type: f.type, // 'file' | 'dir'
        size: f.size ?? 0,
        sha: f.sha,
        url: f.html_url ?? `https://github.com/${owner}/${repo}/blob/${ref}/${f.path}`,
        download_url: f.download_url ?? null,
      }));

      return {
        result: `Found ${items.length} items in ${owner}/${repo}${path}`,
        toolResults: [listFilesCall],
        meta: { durationMs: Date.now() - start },
        repository: `${owner}/${repo}`,
        path: path,
        ref: ref,
        count: items.length,
        files: items,
      };
    } catch (error: any) {
      this.logger.error(`listRepositoryFilesFromPrompt error: ${error.message}`);
      throw new HttpException(
        `Error listing repository files: ${error.message}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * Lista archivos/directorios de un path usando query parameters (método original).
   * GET /ai/github/files?owner=...&repo=...&path=/src&ref=main
   */
  @Get('github/files')
  async listRepositoryFiles(@Query() q: ListFilesQueryDto) {
    try {
      const files = await this.githubService.listFiles(q.owner, q.repo, q.path ?? '/', q.ref);
      const items = files.map((f: any) => ({
        name: f.name,
        path: f.path,
        type: f.type, // 'file' | 'dir'
        size: f.size ?? 0,
        sha: f.sha,
        url: f.html_url ?? `https://github.com/${q.owner}/${q.repo}/blob/${q.ref ?? 'main'}/${f.path}`,
        download_url: f.download_url ?? null,
      }));
      return {
        repository: `${q.owner}/${q.repo}`,
        path: q.path ?? '/',
        ref: q.ref ?? 'default',
        count: items.length,
        files: items,
      };
    } catch (error: any) {
      this.logger.error(`listRepositoryFiles error: ${error.message}`);
      throw new HttpException(
        `Error listing repository files: ${error.message}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * Lee contenido de archivo usando prompt para extraer parámetros.
   * POST /ai/github/content
   */
  @Post('github/content')
  async getRepositoryFileContentFromPrompt(@Body() dto: GenerateTextDto) {
    try {
      const start = Date.now();
      
      // Use AI to extract repository information from the prompt
      const result = await this.aiService.generateTextWithTools(dto.prompt, githubTools, dto.options);
      
      // Find the getRepositoryFileContent tool call
      const getContentCall = result.toolCalls?.find((call: any) => call.name === 'getRepositoryFileContent');
      
      if (!getContentCall) {
        throw new HttpException(
          'Could not extract file information from prompt. Please specify owner, repo, and file path.',
          HttpStatus.BAD_REQUEST,
        );
      }

      const { owner, repo, path, ref = 'main' } = getContentCall.args;
      
      if (!owner || !repo || !path) {
        throw new HttpException(
          'Missing required parameters: owner, repo, and path must be specified in the prompt.',
          HttpStatus.BAD_REQUEST,
        );
      }

      // Call the GitHub service with extracted parameters
      const file = await this.githubService.getFileContent(owner, repo, path, ref);
      
      return {
        result: `Retrieved content from ${owner}/${repo}/${path}`,
        toolResults: [getContentCall],
        meta: { durationMs: Date.now() - start },
        repository: `${owner}/${repo}`,
        path: file.path,
        ref: file.ref,
        name: file.name,
        size: file.size,
        sha: file.sha,
        encoding: file.encoding,
        html_url: file.html_url,
        content: file.content, // UTF-8 decodificado
      };
    } catch (error: any) {
      this.logger.error(`getRepositoryFileContentFromPrompt error: ${error.message}`);
      throw new HttpException(
        `Error reading file content: ${error.message}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * Lee contenido de archivo usando query parameters (método original).
   * GET /ai/github/content?owner=...&repo=...&path=/README.md&ref=main
   */
  @Get('github/content')
  async getRepositoryFileContent(@Query() q: GetContentQueryDto) {
    try {
      const file = await this.githubService.getFileContent(q.owner, q.repo, q.path, q.ref);
      return {
        repository: `${q.owner}/${q.repo}`,
        path: file.path,
        ref: file.ref,
        name: file.name,
        size: file.size,
        sha: file.sha,
        encoding: file.encoding,
        html_url: file.html_url,
        content: file.content, // UTF-8 decodificado
      };
    } catch (error: any) {
      this.logger.error(`getRepositoryFileContent error: ${error.message}`);
      throw new HttpException(
        `Error reading file content: ${error.message}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * Lista árbol recursivo (rápido para inventario, no baja contenidos).
   * GET /ai/github/tree?owner=...&repo=...&ref=main
   */
  @Get('github/tree')
  async listTree(@Query() q: ListTreeQueryDto) {
    try {
      const tree = await this.githubService.listTreeRecursive(q.owner, q.repo, q.ref ?? 'main');
      return {
        repository: `${q.owner}/${q.repo}`,
        ref: q.ref ?? 'main',
        count: tree?.length ?? 0,
        tree,
      };
    } catch (error: any) {
      this.logger.error(`listTree error: ${error.message}`);
      throw new HttpException(
        `Error listing repo tree: ${error.message}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  // ---------- GitHub: WRITE ----------
  /**
   * Crea/Actualiza archivo usando prompt para extraer parámetros.
   * POST /ai/github/upsert
   */
  @Post('github/upsert')
  async upsertFileFromPrompt(@Body() dto: GenerateTextDto) {
    try {
      const start = Date.now();
      
      // Use AI to extract repository information from the prompt
      const result = await this.aiService.generateTextWithTools(dto.prompt, githubTools, dto.options);
      
      // Find the upsertFile tool call
      const upsertCall = result.toolCalls?.find((call: any) => call.name === 'upsertFile');
      
      if (!upsertCall) {
        throw new HttpException(
          'Could not extract file operation information from prompt. Please specify owner, repo, path, content, and message.',
          HttpStatus.BAD_REQUEST,
        );
      }

      const { owner, repo, path, content, message, branch = 'main', expectedSha, author, committer } = upsertCall.args;
      
      if (!owner || !repo || !path || !content || !message) {
        throw new HttpException(
          'Missing required parameters: owner, repo, path, content, and message must be specified in the prompt.',
          HttpStatus.BAD_REQUEST,
        );
      }

      // Call the GitHub service with extracted parameters
      const res = await this.githubService.upsertFile({
        owner,
        repo,
        path,
        content,
        message,
        branch,
        expectedSha,
        author,
        committer,
      });

      return {
        result: `Successfully ${expectedSha ? 'updated' : 'created'} file ${owner}/${repo}/${path}`,
        toolResults: [upsertCall],
        meta: { durationMs: Date.now() - start },
        repository: `${owner}/${repo}`,
        path: path,
        branch: branch,
        commit: res.commit,
        content: res.content,
      };
    } catch (error: any) {
      this.logger.error(`upsertFileFromPrompt error: ${error.message}`);
      const status =
        /Conflict/i.test(error.message) ? HttpStatus.CONFLICT : HttpStatus.BAD_REQUEST;
      throw new HttpException(`Error upserting file: ${error.message}`, status);
    }
  }

  /**
   * Crea/Actualiza archivo usando body parameters (método original).
   * POST /ai/github/upsert
   * body: { owner, repo, path, content, message, branch?, expectedSha? }
   */
  @Post('github/upsert-direct')
  async upsertFile(@Body() dto: UpsertFileDto) {
    try {
      const res = await this.githubService.upsertFile({
        owner: dto.owner,
        repo: dto.repo,
        path: dto.path,
        content: dto.content,
        message: dto.message,
        branch: dto.branch ?? 'main',
        expectedSha: dto.expectedSha, // para update seguro
        author: dto.author,
        committer: dto.committer,
      });

      return {
        repository: `${dto.owner}/${dto.repo}`,
        path: dto.path,
        branch: dto.branch ?? 'main',
        commit: res.commit,
        content: res.content,
      };
    } catch (error: any) {
      this.logger.error(`upsertFile error: ${error.message}`);
      const status =
        /Conflict/i.test(error.message) ? HttpStatus.CONFLICT : HttpStatus.BAD_REQUEST;
      throw new HttpException(`Error upserting file: ${error.message}`, status);
    }
  }

  /**
   * Borra archivo.
   * POST /ai/github/delete
   * body: { owner, repo, path, message?, branch? }
   */
  @Post('github/delete')
  async deleteFile(@Body() dto: DeleteFileDto) {
    try {
      const res = await this.githubService.deleteFile({
        owner: dto.owner,
        repo: dto.repo,
        path: dto.path,
        message: dto.message,
        branch: dto.branch ?? 'main',
      });
      return {
        repository: `${dto.owner}/${dto.repo}`,
        path: dto.path,
        branch: dto.branch ?? 'main',
        commit: res.commit,
        content: res.content,
      };
    } catch (error: any) {
      this.logger.error(`deleteFile error: ${error.message}`);
      throw new HttpException(`Error deleting file: ${error.message}`, HttpStatus.BAD_REQUEST);
    }
  }
}
