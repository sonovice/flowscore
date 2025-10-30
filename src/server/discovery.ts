import { randomBytes } from "node:crypto";
import os from "node:os";
import { createRequire } from "node:module";

// Use createRequire for CommonJS module compatibility with Bun
const require = createRequire(import.meta.url);
const BonjourModule = require("bonjour-service");

// bonjour-service exports: { Bonjour, Service, Browser, default }
// Use default export or Bonjour property (both are the constructor)
const Bonjour = BonjourModule.default || BonjourModule.Bonjour || BonjourModule;

let bonjourInstance: any = null;
let publishedService: any = null;

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
