import dgram from "node:dgram";

const SSDP_MULTICAST_ADDRESS = "239.255.255.250";
const SSDP_PORT = 1900;
const SERVICE_TYPE = "flowscore:broker:1";
const DISCOVERY_TIMEOUT = 10000; // 10 seconds

export interface DiscoveredServer {
	address: string;
	port: number;
	url: string;
	wsUrl: string;
}

/**
 * Discovers FlowScore broker servers on the local network using SSDP.
 * Returns a promise that resolves to an array of discovered servers.
 *
 * @param timeout - Maximum time to wait for responses (default: 5000ms)
 * @returns Promise resolving to an array of discovered servers
 */
export async function discoverServers(
	timeout: number = DISCOVERY_TIMEOUT,
): Promise<DiscoveredServer[]> {
	return new Promise((resolve, reject) => {
		const socket = dgram.createSocket({ type: "udp4", reuseAddr: true });
		const discoveredServers = new Map<string, DiscoveredServer>();
		let timeoutId: ReturnType<typeof setTimeout> | null = null;

		socket.on("error", (err) => {
			if (timeoutId) clearTimeout(timeoutId);
			socket.close();
			reject(err);
		});

		socket.on("message", (msg) => {
			const message = msg.toString();
			const lines = message.split("\r\n");

			// Parse response headers
			let location = "";
			let st = "";

			for (const line of lines) {
				const upperLine = line.toUpperCase();
				if (upperLine.startsWith("LOCATION:")) {
					location = line.substring(9).trim();
				} else if (upperLine.startsWith("ST:")) {
					st = line.substring(3).trim();
				}
			}

			// Check if this is a response for our service type
			if (st === SERVICE_TYPE && location) {
				try {
					const url = new URL(location);
					const address = url.hostname;
					const port = parseInt(url.port || "8765", 10);
					const wsUrl = `ws://${address}:${port}/ws?type=provider`;

					// Use address:port as unique key to avoid duplicates
					const key = `${address}:${port}`;
					if (!discoveredServers.has(key)) {
						discoveredServers.set(key, {
							address,
							port,
							url: location,
							wsUrl,
						});
					}
				} catch {
					// Invalid URL, skip
				}
			}
		});

		// Bind socket and send M-SEARCH request
		socket.bind(() => {
			// Join multicast group
			socket.addMembership(SSDP_MULTICAST_ADDRESS);

			// Create M-SEARCH request
			const searchRequest = [
				"M-SEARCH * HTTP/1.1",
				`HOST: ${SSDP_MULTICAST_ADDRESS}:${SSDP_PORT}`,
				`MAN: "ssdp:discover"`,
				`ST: ${SERVICE_TYPE}`,
				`MX: ${Math.ceil(timeout / 1000)}`,
				"",
				"",
			].join("\r\n");

			// Send M-SEARCH request
			const encoder = new TextEncoder();
			socket.send(
				encoder.encode(searchRequest),
				SSDP_PORT,
				SSDP_MULTICAST_ADDRESS,
				(err) => {
					if (err) {
						if (timeoutId) clearTimeout(timeoutId);
						socket.close();
						reject(err);
						return;
					}

					// Set timeout to wait for responses
					timeoutId = setTimeout(() => {
						socket.close();
						resolve(Array.from(discoveredServers.values()));
					}, timeout);
				},
			);
		});
	});
}

/**
 * Discovers the first available FlowScore broker server.
 * Convenience function that returns the first discovered server or null.
 *
 * @param timeout - Maximum time to wait for responses (default: 5000ms)
 * @returns Promise resolving to the first discovered server or null
 */
export async function discoverFirstServer(
	timeout: number = DISCOVERY_TIMEOUT,
): Promise<DiscoveredServer | null> {
	const servers = await discoverServers(timeout);
	return servers.length > 0 ? servers[0] : null;
}
