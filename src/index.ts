import {serve} from "./server";
import {getLocalIp} from "./server/utils.ts";
import packageJsonServer from '../package.json';

const DEFAULT_PORT = 8765;

/**
 * Main entry point for the application.
 */

// Parse CLI arguments
const args = Bun.argv;
const portIndex = args.indexOf('--port') || args.indexOf('-p');
const hasUnknownArgs = args.length > 2 && portIndex === -1;

const helpText = `FlowScore server v${packageJsonServer.version}
    Usage: ./FlowScoreApp [OPTIONS]
    Options:
     --port, -p    Set custom port number. Default is ${DEFAULT_PORT}.
  `

// Print help
console.log(helpText);

// If there are unknown arguments, exit the process
if (hasUnknownArgs) {
  process.exit(0);
}

// Get local network IP
const localIP = getLocalIp();

// Parse port from CLI arguments or default to DEFAULT_PORT
let port = portIndex !== -1 && Bun.argv[portIndex + 1] ? Number(Bun.argv[portIndex + 1]) : DEFAULT_PORT;

// Start the server
serve(localIP, port);