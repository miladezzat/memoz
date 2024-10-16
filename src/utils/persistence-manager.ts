// utils/persistence-manager.ts
import fs, { promises as fsPromises } from 'fs';
import path from 'path';
import { DocumentWithId, MEMOZID } from '../types';

export class PersistenceManager<T> {
  private db: Map<MEMOZID, DocumentWithId<T>>;

  private filePath: string|undefined;

  private persistToDisk: boolean|undefined;

  constructor(db: Map<MEMOZID, DocumentWithId<T>>, filePath: string | undefined, persistToDisk?: boolean) {
    this.db = db;
    this.filePath = filePath ? path.resolve(filePath) : './data.json';
    this.persistToDisk = persistToDisk;
  }

  public async saveToDisk(): Promise<void> {
    if (this.persistToDisk && this.filePath) {
      const dir = path.dirname(this.filePath);

      await fsPromises.mkdir(dir, { recursive: true });
      const writeStream = fs.createWriteStream(this.filePath);

      writeStream.write(JSON.stringify(Array.from(this.db.entries())));
      writeStream.end();
    }
  }

  public async loadFromDisk(): Promise<void> {
    // if filePath is provide and node exists create the file
    if (this.filePath && !fs.existsSync(this.filePath)) {
      await fsPromises.writeFile(this.filePath, []);
    }

    if (this.filePath && this.persistToDisk) {
      // Check if the file exists
      await fsPromises.access(this.filePath);
      // Load the file contents
      const data = await fsPromises.readFile(this.filePath, 'utf8');
      if (data) {
        const entries = JSON.parse(data) as [MEMOZID, DocumentWithId<T>][];

        this.db.clear(); // Clear the original Map reference
        entries.forEach(([key, value]) => {
          this.db.set(key, value); // Populate the original Map
        });
      }
    }
  }
}

export default PersistenceManager;
