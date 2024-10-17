import { DocumentWithId, MEMOZID } from '../types';

export class TransactionManager<T> {
  private db: Map<MEMOZID, DocumentWithId<T>>;

  private transactionDb: Map<MEMOZID, DocumentWithId<T>> | null = null;

  private dbSnapshot: Map<MEMOZID, DocumentWithId<T>> | null = null;

  constructor(db: Map<MEMOZID, DocumentWithId<T>>) {
    this.db = db;
  }

  public beginTransaction(): void {
    if (this.transactionDb) {
      throw new Error('Transaction already in progress');
    }
    // Take a snapshot of the current state before the transaction begins
    this.dbSnapshot = new Map(this.db);
    // Initialize a transaction state, which will hold temporary changes
    this.transactionDb = new Map(this.db);
  }

  public commitTransaction(): void {
    if (!this.transactionDb) {
      throw new Error('No transaction in progress');
    }
    // Apply the changes made in the transaction to the main db
    this.db = this.transactionDb;
    this.transactionDb = null;
    this.dbSnapshot = null; // Clear the snapshot after committing
  }

  public rollbackTransaction(): void {
    if (!this.transactionDb) {
      throw new Error('No transaction in progress');
    }
    if (!this.dbSnapshot) {
      throw new Error('No snapshot available for rollback');
    }
    // Restore the original db state from the snapshot
    this.db = this.dbSnapshot;
    this.transactionDb = null;
    this.dbSnapshot = null; // Clear the snapshot after rollback
  }

  public getCurrentDb(): Map<MEMOZID, DocumentWithId<T>> {
    return this.transactionDb || this.db;
  }
}

export default TransactionManager;
