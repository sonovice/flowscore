import { discoverFirstServer } from "../src/discovery-client.ts";

/**
 * Example provider that uses SSDP discovery to automatically find the FlowScore broker server.
 * This demonstrates how to use the discovery client to connect without hardcoding the server URL.
 */
async function main() {
	console.log("Discovering FlowScore broker server...");

	try {
		const server = await discoverFirstServer(5000);

		if (!server) {
			console.error("No FlowScore broker server found on the network.");
			console.log(
				"   Make sure the server is running and on the same network.",
			);
			process.exit(1);
		}

		console.log(`Found server at ${server.address}:${server.port}`);
		console.log(`   WebSocket URL: ${server.wsUrl}`);

		// Here you would connect to the WebSocket using your WebSocket client library
		// Example:
		// const ws = new WebSocket(server.wsUrl);
		// ws.on('open', () => {
		//   console.log('Connected to broker');
		//   // Send your MEI data
		//   ws.send(meiData);
		// });

		console.log("\nTo connect, use the WebSocket URL shown above.");
	} catch (error) {
		console.error("Discovery failed:", error);
		process.exit(1);
	}
}

// Run if executed directly
if (import.meta.main) {
	main();
}

