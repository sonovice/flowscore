import createVerovioModule from 'verovio/wasm';
import {VerovioToolkit} from 'verovio/esm';
import type {toolkit} from "verovio";

// Suppress Verovio warnings (too much...)
console.warn = () => {
};

/**
 * Verovio toolkit instance
 * @type {toolkit}
 */
let vrv: toolkit;

/**
 * Flag to check if Verovio toolkit is initialized
 * @type {boolean}
 */
let vrvInitialized = false;

/**
 * Queue to hold messages until Verovio toolkit is initialized
 * @type {MessageEvent[]}
 */
const messageQueue: MessageEvent[] = [];

/**
 * Initialize Verovio toolkit and process queued messages
 */
createVerovioModule().then(VerovioModule => {
  vrv = new VerovioToolkit(VerovioModule);
  console.log(`Verovio (WASM) ${vrv.getVersion()}`);

  vrvInitialized = true;
  while (messageQueue.length > 0) {
    handleIncomingMessage(messageQueue.shift()!);
  }
});

/**
 * Handle incoming messages and perform actions based on command
 * @param {MessageEvent} event - The incoming message event
 */
function handleIncomingMessage(event: MessageEvent) {
  if (event.data.cmd === 'loadData') {
    vrv.loadData(event.data.param);
    postMessage({cmd: 'loadData'})
  } else if (event.data.cmd === 'renderToSVG') {
    const svgs: string[] = [];

    vrv.setOptions(event.data.param);
    vrv.redoLayout();
    for (let i = 1; i <= vrv.getPageCount(); i++) {
      svgs.push(vrv.renderToSVG(i));
    }
    postMessage({cmd: 'renderToSVG', result: svgs})
  } else if (event.data.cmd === 'getPageWithElement') {
    const page: number = vrv.getPageWithElement(event.data.param);
    postMessage({cmd: 'getPageWithElement', result: page})
  }
}

/**
 * Handle incoming messages. If Verovio toolkit is not initialized, queue the message
 */
onmessage = async function (event) {
  if (vrvInitialized) {
    handleIncomingMessage(event);
  } else {
    messageQueue.push(event);
  }
}