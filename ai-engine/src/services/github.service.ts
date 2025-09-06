import { Injectable, Logger } from '@nestjs/common';
import { Octokit } from 'octokit';
import { retry } from '@octokit/plugin-retry';
import { throttling } from '@octokit/plugin-throttling';

const MyOctokit = Octokit.plugin(retry, throttling);

type UpsertParams = {
  owner: string;
  repo: string;
  path: string;
  content: string | Buffer;    // contenido en UTF-8 o binario
  message: string;             // commit message
  branch?: string;             // por defecto 'main'
  author?: { name: string; email: string };
  committer?: { name: string; email: string };
  expectedSha?: string;        // sha esperado para update (optimistic concurrency)
};

type DeleteParams = {
  owner: string;
  repo: string;
  path: string;
  message?: string;
  branch?: string;
};

@Injectable()
export class GitHubService {
  private readonly logger = new Logger(GitHubService.name);
  private readonly octokit: InstanceType<typeof MyOctokit>;

  constructor() {
    this.octokit = new MyOctokit({
      auth: process.env.GITHUB_TOKEN,           // PAT fine-grained o Installation Token
      userAgent: 'ai-engine/1.0.0',
      request: { timeout: 20_000 },            // 20s
      throttle: {
        onRateLimit: (retryAfter, options) => {
          // Reintenta automáticamente 1 vez en rate-limit
          this.logger.warn(`Rate limit on ${options.method} ${options.url}. Retrying after ${retryAfter}s.`);
          return true;
        },
        onSecondaryRateLimit: (retryAfter, options) => {
          this.logger.warn(`Secondary rate limit on ${options.method} ${options.url}. Retrying after ${retryAfter}s.`);
          return true;
        },
      },
      retry: { doNotRetry: ['429'] },
    });
  }

  /**
   * Lista archivos/directorios en un path (no recursivo).
   * `ref` puede ser branch, tag o commit SHA. '/' o '' = raíz del repo.
   */
  async listFiles(owner: string, repo: string, path = '/', ref?: string) {
    const normalized = path.replace(/^\/+/, '');
    try {
      const { data } = await this.octokit.rest.repos.getContent({
        owner,
        repo,
        path: normalized || '',
        ref,
        headers: { 'If-None-Match': '' }, // evita cache 304 en proxies intermedios
      });

      // Si es carpeta: array; si es archivo: objeto.
      return Array.isArray(data) ? data : [data];
    } catch (e: any) {
      this._rethrowAsHelpfulError(e, `listFiles(${owner}/${repo}:${path}@${ref ?? 'default'})`);
    }
  }

  /**
   * Lee un archivo y devuelve contenido UTF-8 + metadatos (incluye sha).
   * Usa el formato JSON (base64) para conservar `sha` sin hacks.
   */
  async getFileContent(owner: string, repo: string, path: string, ref?: string) {
    const normalized = path.replace(/^\/+/, '');
    try {
      const { data } = await this.octokit.rest.repos.getContent({
        owner,
        repo,
        path: normalized,
        ref,
      });

      if (Array.isArray(data) || (data as any).type !== 'file') {
        throw new Error('Path is not a file.');
      }

      const file = data as unknown as {
        name: string;
        path: string;
        sha: string;
        size: number;
        content: string;       // base64
        encoding: 'base64';
        html_url: string;
      };

      // Protección para archivos MUY grandes (GitHub devuelve 403/422 o truncado)
      if (file.size > 5 * 1024 * 1024) { // 5MB aprox. límite cómodo de getContent
        throw new Error('File too large to fetch via contents API.');
      }

      const decoded = Buffer.from(file.content, file.encoding).toString('utf8');
      return {
        name: file.name,
        path: file.path,
        size: file.size,
        sha: file.sha,              // Útil para updates
        content: decoded,
        encoding: 'utf-8',
        html_url: file.html_url,
        ref: ref ?? 'default',
      };
    } catch (e: any) {
      this._rethrowAsHelpfulError(e, `getFileContent(${owner}/${repo}:${path}@${ref ?? 'default'})`);
    }
  }

  /**
   * Crea o actualiza un archivo (un commit por archivo).
   * - Para UPDATE se requiere `sha` actual del blob (expectedSha). Si no se pasa,
   *   intenta leerlo y si existe lo usa; si no existe, crea el archivo.
   */
  async upsertFile(params: UpsertParams) {
    const {
      owner, repo, path, content, message,
      branch = 'main', author, committer, expectedSha,
    } = params;

    try {
      let sha = expectedSha;

      if (!sha) {
        // Intentar ver si el archivo existe para obtener sha
        try {
          const { data } = await this.octokit.rest.repos.getContent({ owner, repo, path, ref: branch });
          if (!Array.isArray(data)) sha = (data as any).sha;
        } catch (e: any) {
          if (e.status !== 404) throw e; // 404 => no existe (CREATE)
        }
      }

      const encoded = Buffer.isBuffer(content)
        ? content.toString('base64')
        : Buffer.from(content, 'utf8').toString('base64');

      const { data } = await this.octokit.rest.repos.createOrUpdateFileContents({
        owner,
        repo,
        path,
        message,
        content: encoded,
        branch,
        sha, // undefined => create; con valor => update
        author,
        committer,
      });

      return data; // incluye content.sha nuevo y commit info
    } catch (e: any) {
      if (e.status === 409) {
        // Conflicto de sha (alguien cambió el archivo). Propagá claramente.
        throw new Error('Conflict: the file has changed on GitHub. Fetch latest sha and retry.');
      }
      this._rethrowAsHelpfulError(e, `upsertFile(${owner}/${repo}:${path}@${branch})`);
    }
  }

  /**
   * Borra un archivo (requiere sha actual).
   */
  async deleteFile(params: DeleteParams) {
    const { owner, repo, path, message = `chore: delete ${path}`, branch = 'main' } = params;
    try {
      const { data } = await this.octokit.rest.repos.getContent({ owner, repo, path, ref: branch });
      if (Array.isArray(data)) throw new Error('Path is a directory, not a file');

      const sha = (data as any).sha;

      const res = await this.octokit.rest.repos.deleteFile({
        owner,
        repo,
        path,
        message,
        branch,
        sha,
      });
      return res.data;
    } catch (e: any) {
      this._rethrowAsHelpfulError(e, `deleteFile(${owner}/${repo}:${path}@${branch})`);
    }
  }

  /**
   * (Opcional) Listado recursivo eficiente: usa git tree recursivo (no baja contenidos).
   * Útil para “listar todo el repo” o hacer búsquedas por extensión.
   */
  async listTreeRecursive(owner: string, repo: string, ref = 'main') {
    try {
      // Resolver ref (branch/tag) a commit sha; si ya viene sha de commit, GitHub lo acepta igual.
      const { data } = await this.octokit.rest.git.getTree({
        owner,
        repo,
        tree_sha: ref,
        recursive: 'true',
      });
      return data.tree; // [{ path, type: 'blob'|'tree', sha, size? }, ...]
    } catch (e: any) {
      this._rethrowAsHelpfulError(e, `listTreeRecursive(${owner}/${repo}@${ref})`);
    }
  }

  private _rethrowAsHelpfulError(e: any, ctx: string): never {
    const code = e?.status || e?.code || 'ERR';
    const msg = e?.message || 'Unknown error';
    this.logger.error(`[GitHubService] ${ctx} failed: [${code}] ${msg}`);
    throw new Error(`GitHub error (${code}) in ${ctx}: ${msg}`);
  }
}
