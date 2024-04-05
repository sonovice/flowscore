import {cors} from '@elysiajs/cors';
import Elysia from "elysia";
import pako from 'pako';
import minifyXML from "minify-xml";

import getStaticFile from '../ui/dist-static';
import {cleanMei, filterStaves} from "./meiHelpers.ts";
import {compareNumbers} from "./utils";

// Color constants for console output
const COLOR_RESET = '\x1b[0m';
const COLOR_RED = '\x1b[31m';
const COLOR_GREEN = '\x1b[32m';
const COLOR_YELLOW = '\x1b[33m';
const COLOR_BLUE = '\x1b[34m';
const COLOR_RED_BOX = '\x1b[41m\x1b[97m';
const COLOR_GREEN_BOX = '\x1b[42m\x1b[97m';

// Globals
const subscribedStaves: Record<string, number> = {}; // Keeps track of the number of clients subscribed to each staff
let providerConnected: boolean = false; // Only one provider can be connected at a time

/**
 * Starts the server on the given host and port.
 *
 * @param {string} host - The host to listen on.
 * @param {number} port - The port to listen on.
 */
export function serve(host: string, port: number) {
  // Create a new Elysia server (HTTP and WebSocket)
  const app = new Elysia({
    websocket: {perMessageDeflate: true},
  })

    // This handler will serve the stats page (http://host:port/stats)
    .get('stats', () => {
      let response = '';
      const totalCount = Object.values(subscribedStaves).reduce((a, b) => a + b, 0);
      response += `Connected clients (${totalCount})\n`;
      response += "=================\n";
      const sortedStaffNums = Object.keys(subscribedStaves).sort(compareNumbers);
      sortedStaffNums.forEach(staffNum => {
        const count = subscribedStaves[staffNum];
        const bar = '█'.repeat(count);
        response += `Staff ${staffNum}:\t${bar} (${count})\n`;
      });
      return response;
    })

    // This handler will serve the UI pages for the clients
    .get('*', async (params) => {
      let path = params.path;

      // Remove leading slash
      if (path.startsWith('/')) {
        path = path.slice(1);
      }

      // Default to index.html if no path is provided
      if (path === '') {
        path = 'index.html'
      }

      // Serve the requested file
      const file = getStaticFile(path);
      if (await file.exists()) {
        // If the file exists, serve it with a 200 status (HTTP OK)
        console.log(`[${new Date().toISOString()}] ${COLOR_GREEN}GET "${path}" ${COLOR_GREEN_BOX}200${COLOR_RESET}`);
        return new Response(file, {headers: {'Content-Type': file.type}});
      } else {
        // If the file does not exist, return a 404 status (HTTP Not Found)
        console.log(`[${new Date().toISOString()}] ${COLOR_RED}GET "${path}" ${COLOR_RED_BOX}404${COLOR_RESET}`);
        return new Response("Not Found", {status: 404});
      }
    })

    // Incoming and outgoing MEI snippets are handlet via websockets
    .ws('/ws', {
      // Called when a message is received
      message(ws, message: any) {
        switch (ws.data.query.type) {
          case 'provider':
            // If the message is from a provider, clean the MEI, split into requested staves, compress and send to clients
            console.log(`[${new Date().toISOString()}] ${COLOR_BLUE}PROVIDER New MEI data${COLOR_RESET}`);
            const fullMeiString = cleanMei(message.toString());
            Object.keys(subscribedStaves).forEach(async staves => {
              const filteredMeiString = filterStaves(fullMeiString, staves);
              const compressedMeiString = pako.deflate(minifyXML(filteredMeiString));
              app.server!.publish(staves, compressedMeiString, false);
              // console.log(`[${new Date().toISOString()}] ${COLOR_BLUE}PUBLISHED Staves "${staves}"${COLOR_RESET}`);
            });
            break;
        }
      },

      // Called when a new connection is opened
      open(ws) {
        switch (ws.data.query.type) {
          case 'provider':
            // Only one provider can be connected at a time
            if (!providerConnected) {
              providerConnected = true;
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
      },

      // Called when a connection is closed
      close(ws) {
        switch (ws.data.query.type) {
          case 'provider':
            // Reset the providerConnected flag when the provider disconnects to allow another provider to connect
            providerConnected = false;
            break;

          case 'client':
            // Unsubscribe from the requested staves
            const staves = ws.data.query.staves || 'all';
            console.log(`[${new Date().toISOString()}] ${COLOR_YELLOW}UNSUBSCRIBED Staves "${staves}"${COLOR_RESET}`);
            subscribedStaves[staves] = Math.max((subscribedStaves[staves] || 1) - 1, 0);
            if (subscribedStaves[staves] === 0) {
              delete subscribedStaves[staves];
            }
            // displayClients(subscribedStaves);
            break;
        }
      }
    })
    // @ts-ignore
    .use(cors()) // Enable CORS
    .listen({port, hostname: '0.0.0.0'}); // Listen on all interfaces

  console.log(`🎶 FlowScore server is running.
   Connect provider to "ws://${host}:${port}/ws?type=provider"
   Connect clients to "http://${host}:${port}/"`);
}
