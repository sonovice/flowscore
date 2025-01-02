import type {toolkit} from "verovio";

// Wrap each Verovio method in a Promise
type AsyncToolkit = {
  [K in keyof toolkit]: toolkit[K] extends (...args: infer A) => infer R
    ? (...args: A) => Promise<R>
    : toolkit[K];
} & {
  destroy: () => void; // Adding 'destroy' method for cleanup
};

interface WorkerResponse {
  id: number;
  result?: any;
  error?: string;
}

export class VerovioWorkerManager {
  private worker: Worker;
  private requestId: number = 0;
  private pending: Map<number, { resolve: Function; reject: Function }> = new Map();

  constructor() {
    this.worker = new Worker(new URL('./verovio-worker.ts', import.meta.url), {type: 'module'});
    this.worker.onmessage = this.handleMessage.bind(this);
    this.worker.onerror = this.handleError.bind(this);
  }

  /**
   * Handles messages received from the worker.
   */
  private handleMessage(event: MessageEvent) {
    const data: WorkerResponse = event.data;
    const {id, result, error} = data;

    const handlers = this.pending.get(id);
    if (handlers) {
      if (error) {
        handlers.reject(new Error(error));
      } else {
        handlers.resolve(result);
      }
      this.pending.delete(id);
    }
  }

  /**
   * Handles errors from the worker.
   */
  private handleError(event: ErrorEvent) {
    console.error('Worker error:', event);
    // Reject all pending promises
    this.pending.forEach(({reject}) => {
      reject(new Error(event.message));
    });
    this.pending.clear();
  }

  /**
   * Sends a method call to the worker and returns a Promise.
   */
  public callMethod(method: string, params: any[]): Promise<any> {
    const id = this.requestId++;
    return new Promise((resolve, reject) => {
      this.pending.set(id, {resolve, reject});
      this.worker.postMessage({id, method, params});
    });
  }

  /**
   * Terminates the worker and rejects all pending promises.
   */
  public destroy() {
    this.worker.terminate();
    this.pending.forEach(({reject}) => {
      reject(new Error('Worker terminated.'));
    });
    this.pending.clear();
  }
}

/**
 * Factory function to create a Verovio instance with proper typing.
 */
function createVerovio(): AsyncToolkit {
  const manager = new VerovioWorkerManager();

  const proxy = new Proxy(manager, {
    get(target, prop) {
      if (prop === 'destroy') {
        return target.destroy.bind(target);
      }

      if (typeof prop === 'string') {
        return (...args: any[]) => target.callMethod(prop, args);
      }

      throw new Error(`Property ${String(prop)} is not a valid Verovio method.`);
    },
  });

  return proxy as unknown as AsyncToolkit;
}

// Export singleton instance
export const verovio = createVerovio();