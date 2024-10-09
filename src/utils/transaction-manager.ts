// utils/transaction-manager.ts
import { DocumentWithId, MEMOZID } from '../types';

export class TransactionManager<T> {
  private db: Map<MEMOZID, DocumentWithId<T>>;

  private transactionDb: Map<MEMOZID, DocumentWithId<T>> | null = null;

  constructor(db: Map<MEMOZID, DocumentWithId<T>>) {
    this.db = db;
  }

  public beginTransaction(): void {
    if (this.transactionDb) {
      throw new Error('Transaction already in progress');
    }
    this.transactionDb = new Map(this.db); // Create a snapshot of the current state
  }

  public commitTransaction(): void {
    if (!this.transactionDb) {
      throw new Error('No transaction in progress');
    }
    this.transactionDb = null; // Finalize transaction
  }

  public rollbackTransaction(): void {
    if (!this.transactionDb) {
      throw new Error('No transaction in progress');
    }
    this.db = this.transactionDb; // Restore the state from the snapshot
    this.transactionDb = null; // Clear the temporary store
  }

  public getCurrentDb(): Map<MEMOZID, DocumentWithId<T>> {
    return this.transactionDb || this.db;
  }
}

export default TransactionManager;
