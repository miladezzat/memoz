// utils/persistence-manager.ts
import fs, { promises as fsPromises } from 'fs';
import path from 'path';
import { DocumentWithId, MEMOZID } from '../types';

/**
 * A class to manage persistence of data in a Map structure, allowing
 * for saving to and loading from disk.
 *
 * @template T - The type of documents stored in the Map.
 */
export class PersistenceManager<T> {
  /**
   * A Map that holds the documents with their associated IDs.
   *
   * @private
   * @type {Map<MEMOZID, DocumentWithId<T>>}
   */
  private db: Map<MEMOZID, DocumentWithId<T>>;

  /**
   * The file path where data will be persisted, if applicable.
   *
   * @private
   * @type {string | undefined}
   */
  private filePath: string | undefined;

  /**
   * A flag indicating whether to persist data to disk.
   *
   * @private
   * @type {boolean | undefined}
   */
  private persistToDisk: boolean | undefined;

  /**
   * Creates an instance of PersistenceManager.
   *
   * @param {Map<MEMOZID, DocumentWithId<T>>} db - The initial database as a Map.
   * @param {string | undefined} filePath - The path to the file for persistence.
   * @param {boolean} [persistToDisk] - Flag indicating whether to persist data to disk.
   */
  constructor(db: Map<MEMOZID, DocumentWithId<T>>, filePath: string | undefined, persistToDisk?: boolean) {
    this.db = db;
    this.filePath = filePath ? path.resolve(filePath) : './data.json';
    this.persistToDisk = persistToDisk;
  }

  /**
   * Saves the current state of the Map to disk as a JSON file.
   *
   * @returns {Promise<void>} A promise that resolves when the operation is complete.
   *
   * @throws {Error} If there is an error writing to the file.
   */
  public async saveToDisk(): Promise<void> {
    if (this.persistToDisk && this.filePath) {
      const dir = path.dirname(this.filePath);

      await fsPromises.mkdir(dir, { recursive: true });
      const writeStream = fs.createWriteStream(this.filePath);

      writeStream.write(JSON.stringify(Array.from(this.db.entries())));
      writeStream.end();
    }
  }

  /**
   * Loads data from disk into the Map.
   *
   * @returns {Promise<void>} A promise that resolves when the operation is complete.
   *
   * @throws {Error} If there is an error reading the file or parsing the JSON data.
   */
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
