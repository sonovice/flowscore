import { cors } from '@elysiajs/cors';
import { Elysia } from "elysia";
import getStaticFile from '../ui/dist-static';
import {compareStaffNums, displayClients, splitMei} from "./utils";
import pako from 'pako';


const COLOR_RESET = '\x1b[0m';
const COLOR_RED = '\x1b[31m';
const COLOR_GREEN = '\x1b[32m';
const COLOR_YELLOW = '\x1b[33m';
const COLOR_BLUE = '\x1b[34m';
const COLOR_MAGENTA = '\x1b[35m';


const COLOR_RED_BOX = '\x1b[41m\x1b[97m';
const COLOR_GREEN_BOX = '\x1b[42m\x1b[97m';

// Globals
const subscribedStaves: Record<string, number> = {};
let providerConnected: boolean = false;

export function serve(host: string, port: number) {
  const app = new Elysia({
    websocket: { perMessageDeflate: true },
  })
    .get('stats', () => {
      let response = '';
      const totalCount = Object.values(subscribedStaves).reduce((a, b) => a + b, 0);
      response += `Connected clients (${totalCount})\n`;
      response += "=================\n";
      const sortedStaffNums = Object.keys(subscribedStaves).sort(compareStaffNums);
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
      if (path.startsWith('/')) {
        path = path.slice(1);
      }

      if (path === '') {
        path = 'index.html'
      }

      const file = getStaticFile(path);
      if (await file.exists()) {
        console.log(`[${new Date().toISOString()}] ${COLOR_GREEN}GET "${path}" ${COLOR_GREEN_BOX}200${COLOR_RESET}`);
        return new Response(file, { headers: { 'Content-Type': file.type } });
      } else {
        console.log(`[${new Date().toISOString()}] ${COLOR_RED}GET "${path}" ${COLOR_RED_BOX}404${COLOR_RESET}`);
        return new Response("Not Found", { status: 404 });
      }
    })

    // Incoming and outgoing MEI snippets are handlet via websockets
    .ws('/ws', {
      message(ws, message: any) {
        switch (ws.data.query.type) {
          case 'provider':
            console.log(`[${new Date().toISOString()}] ${COLOR_BLUE}PROVIDER New MEI data${COLOR_RESET}`);
            Object.keys(subscribedStaves).forEach(async staves => {
              const mei = splitMei(message.toString(), staves).toString();
              const compressed = pako.deflate(mei);
              app.server!.publish(staves, compressed, false);
              // console.log(`[${new Date().toISOString()}] ${COLOR_BLUE}PUBLISHED Staves "${staves}"${COLOR_RESET}`);
            });
            break;
        }
      },
      open(ws) {
        switch (ws.data.query.type) {
          case 'provider':
            if (!providerConnected) {
              providerConnected = true;
            } else {
              ws.close(); // Close the connection if another provider is already connected
            }
            break;

          case 'client':
            const staves = ws.data.query.staves || 'all';
            console.log(`[${new Date().toISOString()}] ${COLOR_YELLOW}SUBSCRIBED Staves "${staves}"${COLOR_RESET}`);
            ws.subscribe(staves);
            subscribedStaves[staves] = (subscribedStaves[staves] || 0) + 1;
            // displayClients(subscribedStaves);
            break;
        }
      },
      close(ws) {
        switch (ws.data.query.type) {
          case 'provider':
            providerConnected = false;
            break;

          case 'client':
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
    .use(cors())
    .listen({ port, hostname: '0.0.0.0' });

  console.log(`🎶 Server is running.`);
  console.log(`   Connect provider to "ws://${host}:${port}/ws?type=provider"`);
  console.log(`   Connect clients to "http://${host}:${port}/"`);
}
