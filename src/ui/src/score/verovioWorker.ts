import createVerovioModule from 'verovio/wasm';
import { VerovioToolkit } from 'verovio/esm';
import type { toolkit } from "verovio";

// Suppress Verovio warnings (too much...)
console.warn = () => {};

let vrv: toolkit;
let vrvInitialized = false;
const messageQueue: MessageEvent[] = [];

createVerovioModule().then(VerovioModule => {
    vrv = new VerovioToolkit(VerovioModule);
    console.log(`Verovio (WASM) ${vrv.getVersion()}`);

    vrvInitialized = true;
    while (messageQueue.length > 0) {
        handleIncomingMessage(messageQueue.shift()!);
    }
});

function handleIncomingMessage(event: MessageEvent) {
    if (event.data.cmd === 'loadData') {
        vrv.loadData(event.data.param);
        postMessage({ cmd: 'loadData' })
    } else if (event.data.cmd === 'renderToSVG') {
        const svgs: string[] = [];

        vrv.setOptions(event.data.param);
        vrv.redoLayout();
        for (let i = 1; i <= vrv.getPageCount(); i++) {
            svgs.push(vrv.renderToSVG(i));
        }
        postMessage({ cmd: 'renderToSVG', result: svgs })
    } else if (event.data.cmd === 'getPageWithElement') {
        const page: number = vrv.getPageWithElement(event.data.param);
        postMessage({ cmd: 'getPageWithElement', result: page })
    }
}

onmessage = async function (event) {
    if (vrvInitialized) {
        handleIncomingMessage(event);
    } else {
        messageQueue.push(event);
    }
}