import pako from "pako";
import minifyXML from "minify-xml";
import { app, providerConnected, subscribedStaves } from "../globals.ts";
import { COLOR_BLUE, COLOR_RESET, COLOR_YELLOW } from "../../utils.ts";
import { cleanMei, filterStaves } from "../meiHelpers.ts";

// Queue for incoming MEI data and processing state
const meiQueue: string[] = []; // Stores incoming MEI messages to be processed sequentially
let isProcessing = false; // Indicates whether an MEI message is currently being processed

// Processes the next MEI message from the queue
async function processNextMEI() {
  if (isProcessing || meiQueue.length === 0) return; // Exit if already processing or queue is empty

  isProcessing = true; // Lock processing
  const fullMeiString = meiQueue.shift(); // Get the next message from the queue
  if (!fullMeiString) {
    isProcessing = false;
    return;
  }

  try {
    // Process MEI message for each subscribed stave
    Object.keys(subscribedStaves).forEach(async (staves) => {
      const filteredMeiString = filterStaves(fullMeiString, staves); // Filter MEI for specific staves
      const compressedMeiString = pako.deflate(minifyXML(filteredMeiString)); // Compress and minify the MEI string
      app.value.server!.publish(staves, compressedMeiString, false); // Publish the processed MEI to subscribers
      console.log(`[${new Date().toISOString()}] ${COLOR_BLUE}PUBLISHED Staves "${staves}"${COLOR_RESET}`);
    });
  } catch (error) {
    console.error("Error processing MEI:", error); // Log any errors during processing
  } finally {
    isProcessing = false; // Unlock processing
    processNextMEI(); // Process the next message in the queue
  }
}

// Handles new WebSocket connections
export function handle_open(ws: any) {
  switch (ws.data.query.type) {
    case "provider":
      // Only one provider can be connected at a time
      if (!providerConnected.value) {
        providerConnected.value = true;
      } else {
        ws.close(); // Close the connection if another provider is already connected
      }
      break;

    case "client":
      // Subscribe the client to specific staves or to all staves
      let staves = ws.data.query.staves || "all"; // Default to "all" if no staves are specified
      console.log(`[${new Date().toISOString()}] ${COLOR_YELLOW}SUBSCRIBED Staves "${staves}"${COLOR_RESET}`);
      ws.subscribe(staves); // Subscribe the client
      subscribedStaves[staves] = (subscribedStaves[staves] || 0) + 1; // Increment the subscription count for these staves
      break;
  }
}

// Handles incoming WebSocket messages
export function handle_message(ws: any, message: any) {
  if (ws.data.query.type === "provider") {
    console.log(`[${new Date().toISOString()}] ${COLOR_BLUE}PROVIDER New MEI data${COLOR_RESET}`);
    const cleanedMei = cleanMei(message.toString()); // Clean and sanitize the incoming MEI data
    meiQueue.push(cleanedMei); // Add the cleaned MEI data to the processing queue
    processNextMEI(); // Start processing the queue
  }
}

// Handles WebSocket disconnections
export function handle_close(ws: any) {
  switch (ws.data.query.type) {
    case "provider":
      // Reset the providerConnected flag to allow a new provider to connect
      providerConnected.value = false;
      break;

    case "client":
      // Unsubscribe the client from specific staves or all staves
      const staves = ws.data.query.staves || "all";
      console.log(`[${new Date().toISOString()}] ${COLOR_YELLOW}UNSUBSCRIBED Staves "${staves}"${COLOR_RESET}`);
      subscribedStaves[staves] = Math.max((subscribedStaves[staves] || 1) - 1, 0); // Decrement subscription count
      if (subscribedStaves[staves] === 0) {
        delete subscribedStaves[staves]; // Remove staves from subscriptions if no clients are subscribed
      }
      break;
  }
}