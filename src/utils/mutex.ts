export class Mutex {
  private mutex: Promise<void> = Promise.resolve();

  public lock<T>(callback: () => T | Promise<T>): Promise<T> {
    // Locking mechanism: Wait for the current mutex chain to resolve,
    // then run the callback and capture its result
    const resultPromise = this.mutex.then(() => callback());

    // Update the mutex to wait for the current operation to finish
    this.mutex = resultPromise.then(() => undefined, () => undefined);

    // Return the result of the callback, so the caller gets its value
    return resultPromise;
  }
}
export default Mutex;
