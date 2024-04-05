import {createEffect, Accessor, Setter} from 'solid-js';
import pako, {Data} from 'pako';
import {modifyLabels} from "../utils/meiHelpers.ts";
import {VerovioOptions} from "verovio";
import VirtualScroller from '../externals/virtual-scroller-1.12.4/DOM/VirtualScroller';
import {useSettings} from "../contexts/SettingsContext.tsx";

/**
 * Hook to handle the score provider.
 *
 * @param {Accessor<string[]>} svgStrings - An accessor function for SVG strings.
 * @param {Setter<string[]>} setSvgStrings - A setter function for SVG strings.
 * @param {HTMLElement} containerRef - The container in which the systems are displayed.
 * @param {VirtualScroller<string, undefined>} virtualScroller - The virtual scroller for the systems.
 * @param {Setter<boolean>} setIsWebSocketConnected - A setter function to set the WebSocket connection state.
 */
export function useScoreProvider(
  svgStrings: Accessor<string[]>,
  setSvgStrings: Setter<string[]>,
  containerRef: HTMLElement,
  virtualScroller: VirtualScroller<string, undefined>,
  setIsWebSocketConnected: Setter<boolean>
) {
  // Get settings from the SettingsContext
  const {
    selectedStaves: [selectedStaves],
    scoreScale: [scoreScale]
  } = useSettings();

  // Initialize the Verovio worker
  const vrvWorker = new Worker(
    new URL('../workers/verovioWorker.ts', import.meta.url),
    {
      type: 'module',
    }
  );

  // Initialize the WebSocket
  let ws: WebSocket | null = null;

  // Keep track of the previously selected staves
  let previousStaves: string = selectedStaves().join(',');

  // Connect to the WebSocket
  connectWebSocket();

  /**
   * Connect to the WebSocket.
   */
  function connectWebSocket() {
    // Get the selected staves as a string
    const selectedStavesString = selectedStaves().join(',');

    // Get the hostname and port
    const hostname = window.location.hostname;
    const port = hostname === 'localhost' ? '8765' : window.location.port;

    // Create the WebSocket URL
    const wsUrl = `ws://${hostname}:${port}/ws?type=client&staves=${selectedStavesString}`;

    // Create the WebSocket
    ws = new WebSocket(wsUrl);

    /**
     * Event handler for WebSocket's onopen event.
     * This event is triggered when the WebSocket connection is successfully established.
     *
     * @param {Event} event - The open event.
     */
    ws.onopen = (event) => {
      // Set the WebSocket connection state to true
      setIsWebSocketConnected(true);

      // Log the event
      console.log('WebSocket connection opened:', event);
    };

    /**
     * Event handler for WebSocket's onmessage event.
     * This event is triggered when a message is received from the WebSocket server.
     *
     * @param {MessageEvent} event - The message event.
     */
    ws.onmessage = (event) => {
      // Create a new FileReader to read the data from the event
      const reader = new FileReader();

      /**
       * Event handler for FileReader's onload event.
       * This event is triggered when the reading operation is successfully completed.
       *
       * @param {ProgressEvent<FileReader>} e - The progress event.
       */
      reader.onload = (e) => {
        if (e.target !== null) {
          // Inflate (decompress) the data from the event using pako
          let mei = pako.inflate(e.target.result as Data, {to: "string"});

          // Modify the labels of the MEI data
          mei = modifyLabels(mei, svgStrings().length, selectedStavesString === 'all');

          // Post a message to the Verovio worker to load the data
          vrvWorker.postMessage({cmd: 'loadData', param: mei});
        }
      };

      // Start reading the data from the event as an ArrayBuffer
      reader.readAsArrayBuffer(event.data);
    };

    /**
     * Event handler for WebSocket's onclose event.
     * This event is triggered when the WebSocket connection is closed.
     */
    ws.onclose = () => {
      // Set the WebSocket connection state to false
      setIsWebSocketConnected(false);

      // Log the event
      console.log('WebSocket connection closed, attempting to reconnect...');

      // Attempt to reconnect after a delay
      setTimeout(() => connectWebSocket(), 250);
    };
  }

  /**
   * Render the score.
   */
  function renderScore() {
    // Get the scale, width, height, and margin
    const scale = scoreScale();
    const width = containerRef.clientWidth;
    const height = containerRef.clientHeight;
    const margin = 16 * 100 / scale;

    // Create the Verovio options
    const options: VerovioOptions = {
      adjustPageHeight: true,
      svgViewBox: true,
      header: 'none',
      footer: 'none',
      justifyVertically: false,
      pageWidth: width * 100 / scale,
      pageHeight: height * 100 / scale,
      pageMarginTop: margin,
      pageMarginBottom: margin,
      pageMarginLeft: margin,
      pageMarginRight: margin,
      spacingSystem: 0,
      scale,
      systemMaxPerPage: 1,
      condense: 'none',
    };

    // Post a message to the Verovio worker to render the score
    vrvWorker.postMessage({
      cmd: "renderToSVG",
      param: options
    });
  }

  createEffect(() => {
    vrvWorker.onmessage = (event) => {
      if (event.data.cmd === 'renderToSVG') {
        setSvgStrings([...svgStrings(), ...event.data.result]);
      } else if (event.data.cmd === 'loadData') {
        renderScore();
      }
    };
  });

  createEffect(() => {
    virtualScroller.setItems(svgStrings());
  })

  createEffect(() => {
    // Reset score if settings have been changed
    // setSvgStrings([]);

    // Reconnect WebSocket if staff selection changed
    const selectedStavesString = selectedStaves().join(',');
    if (selectedStavesString !== previousStaves && ws) {
      previousStaves = selectedStavesString;
      ws.onclose = null;
      ws.close();
      connectWebSocket();
    }
  })
}
