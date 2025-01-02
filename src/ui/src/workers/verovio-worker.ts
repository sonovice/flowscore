import createVerovioModule from 'verovio/wasm';
import {VerovioToolkit} from 'verovio/esm';
import type {toolkit, VerovioModule} from 'verovio';

// Suppress Verovio warnings
console.warn = () => {};

let vrv: toolkit;
let vrvInitialized = false;
const messageQueue: MessageEvent[] = [];

/**
 * Initializes the Verovio toolkit.
 */
createVerovioModule().then((module: VerovioModule) => {
  vrv = new VerovioToolkit(module);

  console.log(`Verovio (WASM) ${vrv.getVersion()}`);

  vrvInitialized = true;
  // Process any messages that were queued before initialization
  while (messageQueue.length > 0) {
    handleIncomingMessage(messageQueue.shift()!);
  }
}).catch((error) => {
  console.error('Failed to initialize Verovio:', error);
  // Optionally, send an error message to the main thread
  postMessage({id: null, error: 'Failed to initialize Verovio.'});
});


/**
 * Handles incoming messages by invoking the appropriate Verovio method.
 */
function handleIncomingMessage(event: MessageEvent) {
  const {id, method, params} = event.data;

  if (!vrvInitialized) {
    postMessage({id, error: 'Verovio not initialized yet.'});
    return;
  }

  try {
      // Dynamically call any method on the Verovio toolkit
      const result = (vrv as any)[method](...params);
      postMessage({id, result});
  } catch (error: any) {
    postMessage({id, error: error.message || 'An error occurred.'});
  }
}

/**
 * Listens for messages from the main thread.
 */
onmessage = function (event) {
  if (vrvInitialized) {
    handleIncomingMessage(event);
  } else {
    messageQueue.push(event);
  }
};