import pako from "pako";
import minifyXML from "minify-xml";
import {app, providerConnected, subscribedStaves} from "../globals.ts";
import {COLOR_BLUE, COLOR_RESET, COLOR_YELLOW} from "../../utils.ts";
import {cleanMei, filterStaves} from "../meiHelpers.ts";

export function handle_open(ws: any) {
  switch (ws.data.query.type) {
    case 'provider':
      // Only one provider can be connected at a time
      if (!(providerConnected.value)) {
        providerConnected.value = true;
      } else {
        ws.close(); // Close the connection if another provider is already connected
      }
      break;

    case 'client':
      // Subscribe to the requested staves
      let staves = ws.data.query.staves;
      if (!staves || staves === 'undefined') {
        staves = 'all';
      }
      console.log(`[${new Date().toISOString()}] ${COLOR_YELLOW}SUBSCRIBED Staves "${staves}"${COLOR_RESET}`);
      ws.subscribe(staves);
      subscribedStaves[staves] = (subscribedStaves[staves] || 0) + 1;
      // displayClients(subscribedStaves);
      break;
  }
}

export function handle_message(ws: any, message: any) {
  switch (ws.data.query.type) {
    case 'provider':
      // If the message is from a provider, clean the MEI, split into requested staves, compress and send to clients
      console.log(`[${new Date().toISOString()}] ${COLOR_BLUE}PROVIDER New MEI data${COLOR_RESET}`);
      const fullMeiString = cleanMei(message.toString());
      Object.keys(subscribedStaves).forEach(async staves => {
        const filteredMeiString = filterStaves(fullMeiString, staves);
        const compressedMeiString = pako.deflate(minifyXML(filteredMeiString));
        app.value.server!.publish(staves, compressedMeiString, false);
        // console.log(`[${new Date().toISOString()}] ${COLOR_BLUE}PUBLISHED Staves "${staves}"${COLOR_RESET}`);
      });
      break;
  }
}

export function handle_close(ws: any) {
  switch (ws.data.query.type) {
    case 'provider':
      // Reset the providerConnected flag when the provider disconnects to allow another provider to connect
      providerConnected.value = false;
      break;

    case 'client':
      // Unsubscribe from the requested staves
      const staves = ws.data.query.staves || 'all';
      console.log(`[${new Date().toISOString()}] ${COLOR_YELLOW}UNSUBSCRIBED Staves "${staves}"${COLOR_RESET}`);
      subscribedStaves[staves] = Math.max((subscribedStaves[staves] || 1) - 1, 0);
      if (subscribedStaves[staves] === 0) {
        delete subscribedStaves[staves];
      }
      break;
  }
}