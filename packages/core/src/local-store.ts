import { promises as fs } from 'fs';
import path from 'path';
import { IllustryError } from './errors';
import type { IllustryLocalAsset } from './types';

type LocalStoreOptions = {
  rootDir?: string;
};

const STORE_FILENAME = 'assets.json';

const createId = (prefix: string) => {
  const random = Math.random().toString(36).slice(2, 10);
  return `${prefix}_${Date.now().toString(36)}_${random}`;
};

const sanitizeFilename = (value: string) => value
  .trim()
  .replace(/[/\\?%*:|"<>]/g, '-')
  .replace(/\s+/g, '-')
  .replace(/-+/g, '-')
  .replace(/^-|-$/g, '')
  || 'illustry';

const getErrorCode = (error: unknown) => {
  if (!error || typeof error !== 'object' || !('code' in error)) {
    return undefined;
  }
  const code = Reflect.get(error, 'code');
  return typeof code === 'string' ? code : undefined;
};

class LocalIllustryStore {
  readonly rootDir: string;

  constructor(options: LocalStoreOptions = {}) {
    this.rootDir = path.resolve(options.rootDir || path.join(process.cwd(), '.illustry'));
  }

  private get storePath() {
    return path.join(this.rootDir, STORE_FILENAME);
  }

  private async ensureRoot() {
    await fs.mkdir(this.rootDir, { recursive: true });
  }

  async readAssets(): Promise<IllustryLocalAsset[]> {
    await this.ensureRoot();
    try {
      const raw = await fs.readFile(this.storePath, 'utf8');
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed.assets) ? parsed.assets : [];
    } catch (error) {
      if (getErrorCode(error) === 'ENOENT') {
        return [];
      }
      throw new IllustryError('Unable to read local Illustry workspace.', {
        code: 'ILLUSTRY_LOCAL_STORE_READ_FAILED',
        cause: error
      });
    }
  }

  async writeAssets(assets: IllustryLocalAsset[]) {
    await this.ensureRoot();
    const payload = JSON.stringify({ assets }, null, 2);
    await fs.writeFile(this.storePath, payload, 'utf8');
  }

  async saveAsset(asset: Omit<IllustryLocalAsset, 'id' | 'createdAt' | 'updatedAt'> & Partial<Pick<IllustryLocalAsset, 'id' | 'createdAt' | 'updatedAt'>>) {
    const now = new Date().toISOString();
    const assets = await this.readAssets();
    const next: IllustryLocalAsset = {
      ...asset,
      id: asset.id || createId(asset.kind),
      createdAt: asset.createdAt || now,
      updatedAt: now
    };
    const index = assets.findIndex((item) => item.id === next.id);
    if (index >= 0) {
      assets[index] = next;
    } else {
      assets.push(next);
    }
    await this.writeAssets(assets);
    return next;
  }

  async getAsset(idOrName: string) {
    const assets = await this.readAssets();
    return assets.find((asset) => asset.id === idOrName || asset.name === idOrName);
  }

  async requireAsset(idOrName: string) {
    const asset = await this.getAsset(idOrName);
    if (!asset) {
      throw new IllustryError(`Illustry asset "${idOrName}" was not found.`, {
        code: 'ILLUSTRY_ASSET_NOT_FOUND',
        status: 404
      });
    }
    return asset;
  }

  async deleteAsset(idOrName: string) {
    const assets = await this.readAssets();
    const remaining = assets.filter((asset) => asset.id !== idOrName && asset.name !== idOrName);
    await this.writeAssets(remaining);
    return remaining.length !== assets.length;
  }

  async writeExportFile(file: { filename: string; buffer: Buffer }, outputDir?: string) {
    const targetDir = path.resolve(outputDir || path.join(this.rootDir, 'exports'));
    await fs.mkdir(targetDir, { recursive: true });
    const target = path.join(targetDir, sanitizeFilename(file.filename));
    await fs.writeFile(target, file.buffer);
    return target;
  }
}

export {
  LocalIllustryStore,
  createId,
  sanitizeFilename
};
export type {
  LocalStoreOptions
};
