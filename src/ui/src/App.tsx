import { createSignal, onMount, Show, createEffect } from 'solid-js';
import VirtualScroller from './externals/virtual-scroller-1.12.4/DOM/VirtualScroller';
import NoSleep from '@zakj/no-sleep';

import { useHighlighting } from './hooks/useHighlighting';
import { useInputHandler } from "./hooks/useInputHandler.ts";
import { useScoreProvider } from "./hooks/useScoreProvider.ts";
import { useSettings } from "./contexts/SettingsContext.tsx";

import SettingsModal from "./components/SettingsModal.tsx";

/**
 * Main application component.
 *
 * This component is responsible for managing the application state and rendering the main UI.
 */
function App() {
  // Use settings from the SettingsContext
  const {
    showSeparator: [showSeparator],
    colorizeBottomSystem: [colorizeBottomSystem]
  } = useSettings();

  // Create signals for managing state
  const [svgStrings, setSvgStrings] = createSignal<string[]>([]);
  const [showSettings, setShowSettings] = createSignal(true);
  const [isWebSocketConnected, setIsWebSocketConnected] = createSignal(false);
  const [isScrolling, setIsScrolling] = createSignal(false);
  const [isScrolledToBottom, setIsScrolledToBottom] = createSignal(true);

  // References to DOM elements and external objects
  let containerRef: HTMLDivElement;
  let viewerRef: HTMLDivElement;
  let virtualScroller: VirtualScroller<string>;

  /**
   * Function to render SVG string as an HTML element.
   *
   * @param {string} svgString - The SVG string to render.
   * @returns {HTMLElement} The rendered SVG string as an HTML element.
   */
  function renderSvgString(svgString: string): HTMLElement {
    return (<div class="viewer-system max-h-screen bg-white mb-1" innerHTML={svgString}></div>) as HTMLElement
  }

  /**
   * Function to handle closing the settings modal.
   *
   * This function also enables the NoSleep functionality to prevent the device from sleeping.
   */
  async function handleCloseSettingsModal() {
    setShowSettings(false);
    try {
      const noSleep = new NoSleep();
      noSleep.enable();
    } catch (err: any) {
      console.log(`${err.name}, ${err.message}`);
    }
  }

  /**
   * Function to clear the score.
   *
   * This function resets all rendered score SVGs.
   */
  function handleClearScore() {
    setSvgStrings([]);
  }

  /**
   * Function to check if the container is scrolled to the bottom.
   */
  function checkScrollPosition() {
    if (!containerRef) return;

    const { scrollTop, scrollHeight, clientHeight } = containerRef;
    const threshold = 10; // Small threshold to account for rounding errors
    const isAtBottom = scrollTop + clientHeight >= scrollHeight - threshold;

    setIsScrolledToBottom(isAtBottom);
  }

  // Initialize the application on mount
  onMount(() => {
    const { highlightSystem } = useHighlighting(containerRef, svgStrings, colorizeBottomSystem, isScrolling);
    virtualScroller = new VirtualScroller(viewerRef, [], renderSvgString, { scrollableContainer: containerRef });
    useScoreProvider(svgStrings, setSvgStrings, containerRef, virtualScroller, setIsWebSocketConnected);
    useInputHandler(containerRef, highlightSystem, setIsScrolling);

    // Add scroll event listener to track scroll position
    if (containerRef) {
      containerRef.addEventListener('scroll', checkScrollPosition);
      // Check initial position
      checkScrollPosition();
    }
  });

  // Check scroll position when svgStrings changes
  createEffect(() => {
    svgStrings(); // Track changes to svgStrings
    // Use requestAnimationFrame to ensure DOM has updated before checking scroll position
    requestAnimationFrame(() => {
      checkScrollPosition();
    });
  });

  // Render the application UI
  return (
    <>
      {/* Render the settings modal */}
      <Show when={showSettings()}>
        <SettingsModal onClose={handleCloseSettingsModal} onClear={handleClearScore} isConnected={isWebSocketConnected()} />
      </Show>

      {/* Render the score viewer */}
      <div
        ref={(el) => { containerRef = el; }}
        class="h-screen overflow-y-scroll w-screen relative"
      >
        <div class={showSeparator() ? "bg-blue-100" : ""} ref={(el) => { viewerRef = el; }} />

        {/* Bottom shadow when not scrolled to the end */}
        <Show when={!isScrolledToBottom()}>
          <div class="fixed bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
        </Show>
      </div>

      {/* Arrow down indicator when not scrolled to the end */}
      <Show when={!isScrolledToBottom()}>
        <div class="fixed bottom-6 left-1/2 transform -translate-x-1/2 w-10 h-10 bg-gray-500 bg-opacity-60 rounded-full flex items-center justify-center pointer-events-none">
          <svg class="w-5 h-5 text-white" fill="currentColor" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512" aria-label="Scroll down">
            <title>Scroll down</title>
            <path d="M169.4 470.6c12.5 12.5 32.8 12.5 45.3 0l160-160c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L224 370.8 224 64c0-17.7-14.3-32-32-32s-32 14.3-32 32l0 306.7L54.6 265.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l160 160z" />
          </svg>
        </div>
      </Show>

      {/* Render the settings button */}
      <Show when={!isWebSocketConnected()}>
        <div class="animate-ping fixed bottom-4 right-4 inline-flex h-12 w-12 rounded-full bg-red-500 opacity-75"></div>
      </Show>
      <button
        type="button"
        class={`${isWebSocketConnected() ? "bg-blue-500 opacity-50" : "bg-red-500 opacity-100"} hover:opacity-100 fixed bottom-4 right-4 h-12 w-12 flex items-center justify-center  text-white rounded-full shadow-lg`}
        onClick={() => setShowSettings(!showSettings())}>
        <div class="w-7 h-7 rounded-full">
          <svg class="" fill="currentColor" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" aria-label="Settings">
            <title>Settings</title>
            <path
              d="M495.9 166.6c3.2 8.7 .5 18.4-6.4 24.6l-43.3 39.4c1.1 8.3 1.7 16.8 1.7 25.4s-.6 17.1-1.7 25.4l43.3 39.4c6.9 6.2 9.6 15.9 6.4 24.6c-4.4 11.9-9.7 23.3-15.8 34.3l-4.7 8.1c-6.6 11-14 21.4-22.1 31.2c-5.9 7.2-15.7 9.6-24.5 6.8l-55.7-17.7c-13.4 10.3-28.2 18.9-44 25.4l-12.5 57.1c-2 9.1-9 16.3-18.2 17.8c-13.8 2.3-28 3.5-42.5 3.5s-28.7-1.2-42.5-3.5c-9.2-1.5-16.2-8.7-18.2-17.8l-12.5-57.1c-15.8-6.5-30.6-15.1-44-25.4L83.1 425.9c-8.8 2.8-18.6 .3-24.5-6.8c-8.1-9.8-15.5-20.2-22.1-31.2l-4.7-8.1c-6.1-11-11.4-22.4-15.8-34.3c-3.2-8.7-.5-18.4 6.4-24.6l43.3-39.4C64.6 273.1 64 264.6 64 256s.6-17.1 1.7-25.4L22.4 191.2c-6.9-6.2-9.6-15.9-6.4-24.6c4.4-11.9 9.7-23.3 15.8-34.3l4.7-8.1c6.6-11 14-21.4 22.1-31.2c5.9-7.2 15.7-9.6 24.5-6.8l55.7 17.7c13.4-10.3 28.2-18.9 44-25.4l12.5-57.1c2-9.1 9-16.3 18.2-17.8C227.3 1.2 241.5 0 256 0s28.7 1.2 42.5 3.5c9.2 1.5 16.2 8.7 18.2 17.8l12.5 57.1c15.8 6.5 30.6 15.1 44 25.4l55.7-17.7c8.8-2.8 18.6-.3 24.5 6.8c8.1 9.8 15.5 20.2 22.1 31.2l4.7 8.1c6.1 11 11.4 22.4 15.8 34.3zM256 336a80 80 0 1 0 0-160 80 80 0 1 0 0 160z" />
          </svg>
        </div>
      </button>
    </>
  )
}


export default App;