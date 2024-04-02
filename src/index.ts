import {serve} from "./server";
import {getLocalIp} from "./server/utils.ts";
import packageJsonServer from '../package.json';
import packageJsonUI from './ui/package.json';

// Parse CLI arguments
const args = Bun.argv;
const portIndex = args.indexOf('--port') || args.indexOf('-p');
const hasUnknownArgs = args.length > 2 && portIndex === -1;

const helpText = `FlowScore server v${packageJsonServer.version} with UI v${packageJsonUI.version}
    Usage: ./FlowScoreApp [OPTIONS]
    Options:
     --port, -p    Set custom port number. Default is 8765.
  `

// Print help
console.log(helpText);

if (hasUnknownArgs) {
  process.exit(0);
}

// Get local network IP
const localIP = getLocalIp();

// Parse port from CLI arguments or default to 8765
let port = portIndex !== -1 && Bun.argv[portIndex + 1] ? Number(Bun.argv[portIndex + 1]) : 8765; // If no port is provided, default to 8765
serve(localIP, port);