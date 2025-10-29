import type { Data } from "pako";
import pako from "pako";
import { type Accessor, createEffect, type Setter } from "solid-js";
import type { VerovioOptions } from "verovio";
import { useSettings } from "../contexts/SettingsContext.tsx";
import type VirtualScroller from "../externals/virtual-scroller-1.12.4/DOM/VirtualScroller";
import { modifyLabels } from "../utils/meiHelpers.ts";
import { verovio } from "../workers/ThreadedVerovio";

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
	setIsWebSocketConnected: Setter<boolean>,
) {
	// Get settings from the SettingsContext
	const {
		selectedStaves: [selectedStaves],
		scoreScale: [scoreScale],
		lastMei: [, setLastMei],
		meiSnapshots: [, setMeiSnapshots],
	} = useSettings();

	// Initialize the WebSocket
	let ws: WebSocket | null = null;

	// Keep track of the previously selected staves
	let previousStaves: string = selectedStaves().join(",");

	// Renderings are queued to avoid race conditions
	let currentRenderPromise: Promise<void> | null = null;
	const renderQueue: string[] = [];

	// Connect to the WebSocket
	connectWebSocket();

	/**
	 * Connect to the WebSocket.
	 */
	function connectWebSocket() {
		// Get the selected staves as a string
		const selectedStavesString = selectedStaves().join(",");

		// Get the hostname and port
		const hostname = window.location.hostname;
		const port = hostname === "localhost" ? "8765" : window.location.port;

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
			console.log("WebSocket connection opened:", event);
		};

		/**
		 * Event handler for WebSocket's onmessage event.
		 * This event is triggered when a message is received from the WebSocket server.
		 *
		 * @param {MessageEvent} event - The message event.
		 */
		ws.onmessage = (event) => {
			const reader = new FileReader();

			reader.onload = async (e) => {
				if (e.target !== null) {
					const mei = pako.inflate(e.target.result as Data, { to: "string" });
					setLastMei(mei);
					setMeiSnapshots((prev) => [...prev, mei]);
					const modifiedMei = modifyLabels(
						mei,
						svgStrings().length,
						selectedStavesString === "all",
					);

					// Add MEI to the queue
					renderQueue.push(modifiedMei);

					// If no render is running, start a new one
					if (!currentRenderPromise) {
						processRenderQueue();
					}
				}
			};

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
			console.log("WebSocket connection closed, attempting to reconnect...");

			// Attempt to reconnect after a delay
			setTimeout(() => connectWebSocket(), 250);
		};
	}

	async function processRenderQueue() {
		while (renderQueue.length > 0) {
			const nextMei = renderQueue.shift();
			if (!nextMei) break;
			currentRenderPromise = renderScore(nextMei);
			await currentRenderPromise;
		}
		currentRenderPromise = null;
	}

	/**
	 * Render the score.
	 */
	async function renderScore(mei: string) {
		// Get the scale, width, height, and margin
		const scale = scoreScale();
		const width = containerRef.clientWidth;
		const height = containerRef.clientHeight;
		const margin = (16 * 100) / scale;

		// Create the Verovio options
		const options: VerovioOptions = {
			adjustPageHeight: true,
			svgViewBox: true,
			font: "Bravura",
			header: "none",
			footer: "none",
			justifyVertically: false,
			pageWidth: (width * 100) / scale,
			pageHeight: (height * 100) / scale,
			pageMarginTop: margin,
			pageMarginBottom: margin,
			pageMarginLeft: margin,
			pageMarginRight: margin,
			spacingSystem: 0,
			breaks: "smart",
			scale,
			systemMaxPerPage: 1,
			condense: "none",
			mdivAll: true,
		};

		await verovio.loadData(mei);
		await verovio.setOptions(options);
		await verovio.redoLayout();

		const num_pages = await verovio.getPageCount();
		const svgs: string[] = [];
		for (let i = 1; i <= num_pages; i++) {
			const svg = await verovio.renderToSVG(i);
			svgs.push(svg);
		}
		setSvgStrings([...svgStrings(), ...svgs]);
	}

	createEffect(() => {
		virtualScroller.setItems(svgStrings());
	});

	createEffect(() => {
		// Reset score if settings have been changed
		// setSvgStrings([]);

		// Reconnect WebSocket if staff selection changed
		const selectedStavesString = selectedStaves().join(",");
		if (selectedStavesString !== previousStaves && ws) {
			previousStaves = selectedStavesString;
			ws.onclose = null;
			ws.close();
			connectWebSocket();
		}
	});
}
