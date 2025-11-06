import dgram from "node:dgram";
import { getAllRelevantNetworkDevices } from "../utils.ts";

const SSDP_MULTICAST_ADDRESS = "239.255.255.250";
const SSDP_PORT = 1900;
const SERVICE_TYPE = "flowscore:broker:1";
const NOTIFY_INTERVAL = 10000; // 10 seconds

let socket: dgram.Socket | null = null;
let notifyInterval: ReturnType<typeof setInterval> | null = null;
let serverPort: number = 8765;
let serverAddresses: string[] = [];

/**
 * Creates an SSDP NOTIFY message announcing the FlowScore broker service.
 */
function createNotifyMessage(address: string): string {
	const location = `http://${address}:${serverPort}/`;
	return [
		"NOTIFY * HTTP/1.1",
		`HOST: ${SSDP_MULTICAST_ADDRESS}:${SSDP_PORT}`,
		`NT: ${SERVICE_TYPE}`,
		`NTS: ssdp:alive`,
		`USN: uuid:flowscore-broker-${address.replace(/\./g, "-")}::${SERVICE_TYPE}`,
		`LOCATION: ${location}`,
		`CACHE-CONTROL: max-age=1800`,
		"",
		"",
	].join("\r\n");
}

/**
 * Creates an SSDP M-SEARCH response message.
 */
function createSearchResponse(address: string): string {
	const location = `http://${address}:${serverPort}/`;
	return [
		"HTTP/1.1 200 OK",
		`ST: ${SERVICE_TYPE}`,
		`USN: uuid:flowscore-broker-${address.replace(/\./g, "-")}::${SERVICE_TYPE}`,
		`LOCATION: ${location}`,
		`CACHE-CONTROL: max-age=1800`,
		"",
		"",
	].join("\r\n");
}

/**
 * Starts SSDP discovery service that announces the FlowScore broker.
 * Sends periodic NOTIFY messages and responds to M-SEARCH requests.
 */
export function startDiscovery(port: number) {
	serverPort = port;
	serverAddresses = getAllRelevantNetworkDevices().map((d) => d.address);

	if (serverAddresses.length === 0) {
		console.log("No network interfaces available for SSDP discovery");
		return;
	}

	socket = dgram.createSocket({ type: "udp4", reuseAddr: true });

	socket.on("error", (err) => {
		console.error("SSDP socket error:", err);
	});

	socket.on("message", (msg, rinfo) => {
		const message = msg.toString();
		const lines = message.split("\r\n");

		// Check if this is an M-SEARCH request
		if (lines[0]?.startsWith("M-SEARCH")) {
			// Extract ST header to check if it matches our service type or is "ssdp:all"
			let stHeader = "";
			for (const line of lines) {
				if (line.toUpperCase().startsWith("ST:")) {
					stHeader = line.substring(3).trim();
					break;
				}
			}

			// Respond if it's searching for our service or all services
			if (stHeader === SERVICE_TYPE || stHeader === "ssdp:all") {
				// Send response from each network interface
				const encoder = new TextEncoder();
				for (const address of serverAddresses) {
					const response = createSearchResponse(address);
					socket?.send(
						encoder.encode(response),
						rinfo.port,
						rinfo.address,
						(err) => {
							if (err) {
								console.error(
									`Failed to send SSDP response to ${rinfo.address}:${rinfo.port}:`,
									err,
								);
							}
						},
					);
				}
			}
		}
	});

	// Bind socket to SSDP port
	socket.bind(SSDP_PORT, () => {
		// Join multicast group on all interfaces
		for (const address of serverAddresses) {
			socket?.addMembership(SSDP_MULTICAST_ADDRESS, address);
		}

		// Send initial NOTIFY messages
		sendNotifyMessages();

		// Set up periodic NOTIFY messages
		notifyInterval = setInterval(() => {
			sendNotifyMessages();
		}, NOTIFY_INTERVAL);

		console.log("SSDP discovery service started");
	});
}

/**
 * Sends SSDP NOTIFY messages from all network interfaces.
 */
function sendNotifyMessages() {
	if (!socket) return;

	const encoder = new TextEncoder();
	for (const address of serverAddresses) {
		const message = createNotifyMessage(address);
		socket.send(
			encoder.encode(message),
			SSDP_PORT,
			SSDP_MULTICAST_ADDRESS,
			(err) => {
				if (err) {
					console.error(`Failed to send SSDP NOTIFY from ${address}:`, err);
				}
			},
		);
	}
}

/**
 * Stops the SSDP discovery service.
 */
export function stopDiscovery() {
	if (notifyInterval) {
		clearInterval(notifyInterval);
		notifyInterval = null;
	}

	if (socket) {
		socket.close();
		socket = null;
	}

	console.log("SSDP discovery service stopped");
}
