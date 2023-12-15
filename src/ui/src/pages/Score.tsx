import {useSearchParams, useBeforeLeave} from "@solidjs/router";
import {createSignal, onMount} from 'solid-js';
import {worker as vrvWorker} from "../score";
import VirtualScroller from 'virtual-scroller/dom'
import {VerovioOptions} from "verovio";
import pako, {Data} from 'pako';

function Score() {
  let containerRef: HTMLDivElement;
  let viewerRef: HTMLDivElement;
  let virtualScroller: VirtualScroller<string>;
  let scale = 40;
  let ws: WebSocket

  const [counter, setCounter] = createSignal(0);
  const [svgStrings, setSvgStrings] = createSignal<string[]>([]);
  const [params] = useSearchParams();
  const staves = params.staves


  function connect() {
    ws = new WebSocket(`ws://${window.location.hostname}:${window.location.port}/ws?type=client&staves=${staves}`);
    // const ws = new RobustWebSocket(`ws://localhost:8765/ws?type=client&staves=${staves}`, undefined, { timeout: 1000 });

    ws.addEventListener('open', (event) => {
      console.log('WebSocket connection opened:', event);
    });

    ws.addEventListener('message', (event) => {
      const data = event.data;
      const reader = new FileReader();
      reader.onload = e => {
        if (e.target !== null) {
          const decompressed = pako.inflate(e.target.result as Data, {to: "string"});
          vrvWorker.postMessage({cmd: 'loadData', param: decompressed});
        }
      }
      reader.readAsArrayBuffer(data);

    })

    ws.addEventListener('close', () => {
      setTimeout(connect, 250);
    })
  }

  connect()

  async function renderScore() {
    const width = viewerRef.clientWidth;
    const height = containerRef.clientHeight;
    const margin = 16 * 100 / scale;

    const param: VerovioOptions = {
      adjustPageHeight: true,
      svgViewBox: true,
      // scaleToPageSize: true,
      // shrinkToFit: true,
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
    }

    vrvWorker.postMessage({
      cmd: "renderToSVG",
      param
    })
  }

  vrvWorker.onmessage = function (event) {
    if (event.data.cmd === 'renderToSVG') {
      setSvgStrings([...svgStrings(), ...event.data.result]);
      virtualScroller.setItems(svgStrings());
      setCounter(counter() + event.data.result.length);
    } else if (event.data.cmd === 'loadData') {
      renderScore();
    }
  }

  onMount(async () => {
    virtualScroller = new VirtualScroller(
      viewerRef,
      [],
      renderSvgString,
      {scrollableContainer: containerRef}
    );

    document.addEventListener('keydown', (e) => {
      if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
        e.preventDefault();
        const systems = viewerRef.getElementsByClassName("viewer-system");
        const boundingRects = Array.from(systems).map(system => system.getBoundingClientRect());
        const screenHeight = containerRef.clientHeight;

        if (e.key === "ArrowLeft") {
          containerRef.scrollTo({top: containerRef.scrollTop - (screenHeight * 1.0), behavior: 'smooth'});
        } else if (e.key === "ArrowRight") {
          for (let i = 0; i < boundingRects.length; i++) {
            if (boundingRects[i].bottom > screenHeight) {
              const targetSystem = systems[i] as HTMLDivElement;
              // targetSystem.style.backgroundColor = '#FFEEEE';
              // setTimeout(() => {
              //   targetSystem.style.backgroundColor = '';
              // }, 1500)
              const nextSystemTop = targetSystem.getBoundingClientRect().top + containerRef.scrollTop;
              containerRef.scrollTo({top: nextSystemTop, behavior: 'smooth'});
              break;
            }
          }
        }
      }
    });
  })

  useBeforeLeave(() => {
    if (ws) {
      ws.close();
    }
  })


  return (
    <>
      {/* <p>Score with staves {staves}</p> */}
      <div class="absolute right-0 mr-5">{counter()}</div>
      <div ref={containerRef!} class="h-screen overflow-y-scroll w-screen">
        <div ref={viewerRef!}>
        </div>
      </div>
    </>
  )
}

function renderSvgString(svgString: string): HTMLElement {
  return (<div class="viewer-system max-h-screen transition-all duration-1000 border-b-4 border-b-gray-100"
               innerHTML={svgString}></div>) as HTMLElement
}

export default Score