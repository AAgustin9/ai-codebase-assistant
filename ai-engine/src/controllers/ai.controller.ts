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
      // Si usás herramientas tipo “githubTools”, inyectalas desde tu AiService
      const result = await this.aiService.generateTextWithTools(dto.prompt, githubTools, dto.options);
      return {
        text: result.text,
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
   * Lista archivos/directorios de un path.
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
   * Lee contenido de archivo.
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
   * Crea/Actualiza archivo.
   * POST /ai/github/upsert
   * body: { owner, repo, path, content, message, branch?, expectedSha? }
   */
  @Post('github/upsert')
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
