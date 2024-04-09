import {cors} from '@elysiajs/cors';
import Elysia from "elysia";
import {handle_static_files} from "./handlers/static.ts";
import {handle_stats} from "./handlers/stats.ts";
import {handle_close, handle_message, handle_open} from "./handlers/websocket.ts";
import {app} from "./globals.ts";

/**
 * Starts the server on the given host and port.
 *
 * @param {string} host - The host to listen on.
 * @param {number} port - The port to listen on.
 */
export function serve(host: string, port: number) {
  // Create a new Elysia server (HTTP and WebSocket)
  app.value = new Elysia({
    websocket: {perMessageDeflate: true}, // Enable WebSocket compression
  })
    // Define HTTP routes
    .get('stats', handle_stats)        // This handler will serve the stats page (http://host:port/stats)
    .get('*',     handle_static_files) // This handler will serve the UI pages for the clients

    // Define WebSocket route and handlers
    .ws('/ws', {
      message: handle_message, // Called when a message is received
      open:    handle_open,    // Called when a new connection is opened
      close:   handle_close    // Called when a connection is closed
    })

    // Apply middleware(s)
    .use(cors()) // Enable CORS

    // Start the server
    // '0.0.0.0' -> Listen on all interfaces
    .listen({port, hostname: '0.0.0.0'});

  console.log(`🎶 FlowScore server is running.
   Connect provider to "ws://${host}:${port}/ws?type=provider"
   Connect clients to "http://${host}:${port}/"`);
}
