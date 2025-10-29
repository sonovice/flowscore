import { cors } from "@elysiajs/cors";
import Elysia from "elysia";
import { handle_static_files } from "./handlers/static.ts";
import { handle_stats } from "./handlers/stats.ts";
import {
	handle_close,
	handle_message,
	handle_open,
} from "./handlers/websocket.ts";
import { app } from "./globals.ts";
import { COLOR_GREEN, COLOR_RESET } from "../utils.ts";
import qrcode from "terminal-qr";

/**
 * Starts the server on all available network interfaces and displays connection info grouped by device.
 *
 * @param {Array<{interface: string, address: string}>} networkDevices - Array of network devices to display.
 * @param {number} port - The port to listen on.
 */
export function serve(
	networkDevices: Array<{ interface: string; address: string }>,
	port: number,
) {
	// Create a new Elysia server (HTTP and WebSocket)
	app.value = new Elysia({
		websocket: { perMessageDeflate: true }, // Enable WebSocket compression
	})
		// Define HTTP routes
		.get("stats", handle_stats) // This handler will serve the stats page (http://host:port/stats)
		.get("*", handle_static_files) // This handler will serve the UI pages for the clients

		// Define WebSocket route and handlers
		.ws("/ws", {
			message: handle_message, // Called when a message is received
			open: handle_open, // Called when a new connection is opened
			close: handle_close, // Called when a connection is closed
		})

		// Apply middleware(s)
		.use(cors()) // Enable CORS

		// Start the server
		// '0.0.0.0' -> Listen on all interfaces
		.listen({ port, hostname: "0.0.0.0" });

	console.log(
		`${COLOR_GREEN}🚀 Server is running on all interfaces.${COLOR_RESET}`,
	);

	if (networkDevices.length === 0) {
		console.log("❌ No relevant network devices found.");
	} else {
		console.log(
			`\n📡 Available on ${networkDevices.length} network device(s):\n`,
		);

		networkDevices.forEach((device, index) => {
			console.log(
				`${index + 1}. ${COLOR_GREEN}${device.interface}${COLOR_RESET} (${device.address})`,
			);
			console.log(
				`   • Provider: ws://${device.address}:${port}/ws?type=provider`,
			);
			console.log(`   • Clients:  http://${device.address}:${port}/`);
			qrcode.generate(
				`http://${device.address}:${port}/`,
				{ small: true },
				(qr) => {
					// Indent each line of `qr` by 4 spaces
					const indentedQr = qr
						.split("\n")
						.map((line) => "               " + line)
						.join("\n");
					console.log(indentedQr);
				},
			);
			console.log("");
		});
	}
}
