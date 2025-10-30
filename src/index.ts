import { serve } from "./server";
import { getAllRelevantNetworkDevices } from "./utils.ts";
import packageJsonServer from "../package.json";

const DEFAULT_PORT = 8765;

/**
 * Main entry point for the application.
 */

// Parse CLI arguments
const args = Bun.argv;
const portIndex = args.indexOf("--port") || args.indexOf("-p");
const hasUnknownArgs = args.length > 2 && portIndex === -1;

if (hasUnknownArgs) {
	console.log(`FlowScore server v${packageJsonServer.version}`);
	console.error(`Unknown arguments:`, args.slice(2).join(" "));
	console.log(
		`  Usage: ./FlowScoreApp [OPTIONS]\n  Options:\n    --port, -p    Set custom port number. Default is ${DEFAULT_PORT}.`,
	);
	process.exit(0);
}

const networkDevices = getAllRelevantNetworkDevices();

// Parse port from CLI arguments or default to DEFAULT_PORT
let port =
	portIndex !== -1 && Bun.argv[portIndex + 1]
		? Number(Bun.argv[portIndex + 1])
		: DEFAULT_PORT;

// Start the server
const disableMdns = (process.env.DISABLE_MDNS || "").toLowerCase() === "1" || (process.env.DISABLE_MDNS || "").toLowerCase() === "true";
serve(networkDevices, port, disableMdns);
