// utils/persistence-manager.ts
import fs, { promises as fsPromises } from 'fs';
import path from 'path';
import { DocumentWithId, MEMOZID } from '../types';

export class PersistenceManager<T> {
  private db: Map<MEMOZID, DocumentWithId<T>>;

  private filePath: string;

  private persistToDisk: boolean;

  // eslint-disable-next-line no-undef
  private saveTimeout: NodeJS.Timeout | null = null;

  constructor(filePath: string | undefined, db: Map<MEMOZID, DocumentWithId<T>>, persistToDisk: boolean) {
    this.db = db;
    this.filePath = filePath ? path.resolve(filePath) : './data.json';
    this.persistToDisk = persistToDisk;

    // generate and init the file on disk if it doesn't exist
    if (this.persistToDisk && !fs.existsSync(this.filePath)) {
      fs.writeFileSync(this.filePath, JSON.stringify([]), 'utf8');
    }
  }

  public async saveToDisk(): Promise<void> {
    if (this.persistToDisk) {
      const dir = path.dirname(this.filePath);
      await fsPromises.mkdir(dir, { recursive: true });
      const writeStream = fs.createWriteStream(this.filePath);
      writeStream.write(JSON.stringify(Array.from(this.db.entries())));
      writeStream.end();
      if (this.saveTimeout) {
        clearTimeout(this.saveTimeout);
      }
    }
  }

  public scheduleSaveToDisk(delay = 3000): void {
    if (this.persistToDisk) {
      if (this.saveTimeout) {
        clearTimeout(this.saveTimeout);
      }
      this.saveTimeout = setTimeout(() => this.saveToDisk(), delay);
    }
  }

  public async loadFromDisk(): Promise<void> {
    if (this.persistToDisk && await fsPromises.access(this.filePath).then(() => true).catch(() => false)) {
      const data = await fsPromises.readFile(this.filePath, 'utf8');
      const entries = JSON.parse(data) as [MEMOZID, DocumentWithId<T>][];
      this.db = new Map(entries);
    }
  }

  public async loadFromDiskLazy(): Promise<void> {
    if (this.persistToDisk) {
      await this.loadFromDisk();
    }
  }

  public schedulePeriodicFlush(interval = 60000): void {
    setInterval(() => this.saveToDisk(), interval);
  }
}

export default PersistenceManager;
