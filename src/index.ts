import {serve} from "./server";
import {getLocalIp} from "./server/utils.ts";
import packageJsonServer from '../package.json';
import packageJsonUI from './ui/package.json';

// Parse CLI arguments
const args = Bun.argv.slice(2);
const helpIndex = args.indexOf('--help') || args.indexOf('-h');
const portIndex = args.indexOf('--port') || args.indexOf('-p');
const hasUnknownArgs = args.length > 0 && helpIndex === -1 && portIndex === -1;

// Print help
if (helpIndex !== -1 || hasUnknownArgs) {
  console.log(`FlowScore server v${packageJsonServer.version} with UI v${packageJsonUI.version}
    Usage: ./FlowScoreApp [OPTIONS]
    Options:
     --port      Set custom port number. Default is 8765.
     --help      Show this help menu.
  `);
  process.exit(0);
}

// Get local network IP
const localIP = getLocalIp();

// Parse port from CLI arguments or default to 8765
let port = portIndex !== -1 && Bun.argv[portIndex + 1] ? Number(Bun.argv[portIndex + 1]) : 8765; // If no port is provided, default to 8765
serve(localIP, port);