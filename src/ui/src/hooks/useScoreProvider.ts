import {createEffect, Accessor, Setter} from 'solid-js';
import pako, {Data} from 'pako';
import {modifyLabels} from "../utils/meiHelpers.ts";
import {VerovioOptions} from "verovio";
import VirtualScroller from "virtual-scroller/dom";
import {useSettings} from "../contexts/SettingsContext.tsx";

export function useScoreProvider(
  svgStrings: Accessor<string[]>,
  setSvgStrings: Setter<string[]>,
  containerRef: HTMLElement,
  virtualScroller: VirtualScroller<string, undefined>,
  setIsWebSocketConnected: Setter<boolean>
) {
  const {
    selectedStaves: [selectedStaves],
    scoreScale: [scoreScale]
  } = useSettings();

  const vrvWorker = new Worker(
    new URL('../workers/verovioWorker.ts', import.meta.url),
    {
      type: 'module',
    }
  );
  let ws: WebSocket | null = null;
  let previousStaves: string = selectedStaves().join(',');


  connectWebSocket();


  function connectWebSocket() {
    const selectedStavesString = selectedStaves().join(',');
    const hostname = window.location.hostname;
    const port = hostname === 'localhost' ? '8765' : window.location.port;
    const wsUrl = `ws://${hostname}:${port}/ws?type=client&staves=${selectedStavesString}`;

    ws = new WebSocket(wsUrl);

    ws.onopen = (event) => {
      setIsWebSocketConnected(true);
      console.log('WebSocket connection opened:', event);
    };

    ws.onmessage = (event) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target !== null) {
          let mei = pako.inflate(e.target.result as Data, {to: "string"});
          mei = modifyLabels(mei, svgStrings().length, selectedStavesString === 'all');
          vrvWorker.postMessage({cmd: 'loadData', param: mei});
        }
      };
      reader.readAsArrayBuffer(event.data);
    };

    ws.onclose = () => {
      setIsWebSocketConnected(false);
      console.log('WebSocket connection closed, attempting to reconnect...');
      setTimeout(() => connectWebSocket(), 250);
    };
  }

  function renderScore() {
    const scale = scoreScale();
    const width = containerRef.clientWidth;
    const height = containerRef.clientHeight;
    const margin = 16 * 100 / scale;

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
    setSvgStrings([]);

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
