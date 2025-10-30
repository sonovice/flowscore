import { randomBytes } from "node:crypto";
import os from "node:os";
import Bonjour from "bonjour-service";

let bonjourInstance: Bonjour | null = null;
let publishedService: ReturnType<Bonjour["publish"]> | null = null;

/**
 * Generate a random alphanumeric string.
 */
function randomId(length: number = 6): string {
	return randomBytes(length)
		.toString("base64")
		.replace(/[^a-zA-Z0-9]/g, "")
		.substring(0, length);
}

/**
 * Start advertising the FlowScore broker on the local network via mDNS/DNS-SD.
 *
 * Service type: _flowscore._tcp
 * TXT records: { path: "/ws", role: "broker", proto: "ws" }
 *
 * Returns an object with the service name and an async function to stop the advertising.
 */
export function startServiceDiscovery(port: number): {
	serviceName: string;
	stop: () => Promise<void>;
} {
	// Create Bonjour instance lazily
	bonjourInstance = new Bonjour();

	// Publish the service with a unique name to avoid collisions
	const randomSuffix = randomId(6);
	const uniqueName = `FlowScore Broker (${os.hostname()}:${port}-${randomSuffix})`;
	const service = bonjourInstance.publish({
		name: uniqueName,
		type: "flowscore", // results in _flowscore._tcp
		port,
		txt: {
			path: "/ws",
			role: "broker",
			proto: "ws",
		},
	});

	publishedService = service;
	service?.start?.();

	// Provide a stopper to cleanly unpublish and destroy bonjour
	return {
		serviceName: uniqueName,
		stop: async function stopServiceDiscovery() {
			try {
				await new Promise<void>((resolve) =>
					publishedService?.stop?.(() => resolve()),
				);
			} catch (_) {
				// ignore
			} finally {
				bonjourInstance?.destroy();
				publishedService = null;
				bonjourInstance = null;
			}
		},
	};
}
