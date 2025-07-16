import os from "node:os";

// Color constants for console output
export const COLOR_RESET = "\x1b[0m";
export const COLOR_RED = "\x1b[31m";
export const COLOR_GREEN = "\x1b[32m";
export const COLOR_YELLOW = "\x1b[33m";
export const COLOR_BLUE = "\x1b[34m";
export const COLOR_RED_BOX = "\x1b[41m\x1b[97m";
export const COLOR_GREEN_BOX = "\x1b[42m\x1b[97m";

/**
 * Compares two strings based on the numeric values found within them.
 * If the numeric values are equal, it falls back to a locale-based string comparison.
 *
 * @param {string} a - The first string to compare.
 * @param {string} b - The second string to compare.
 * @returns {number} - A negative number if `a` should be sorted before `b`, a positive number if `a` should be sorted after `b`, or 0 if they are equal.
 */
export function compareNumbers(a: string, b: string): number {
	const extractNumbers = (str: string) => (str.match(/\d+/g) || []).map(Number);

	const numsA = extractNumbers(a);
	const numsB = extractNumbers(b);

	const minLength = Math.min(numsA.length, numsB.length);

	for (let i = 0; i < minLength; i++) {
		if (numsA[i] !== numsB[i]) {
			return numsA[i] - numsB[i];
		}
	}

	if (numsA.length !== numsB.length) {
		return numsA.length - numsB.length;
	}

	return a.localeCompare(b);
}

/**
 * Retrieves the local IP address of the machine.
 * It prioritizes non-virtual interfaces and looks for an IPv4 address that is not internal.
 *
 * @returns {string} - The local IP address.
 * @throws {Error} - If unable to retrieve the local network IP address.
 */
export function getLocalIp(): string {
	const netInterfaces = os.networkInterfaces();
	const candidates: string[] = [];

	for (const netInterfaceName in netInterfaces) {
		const netInterface = netInterfaces[netInterfaceName];
		if (netInterface) {
			for (const iface of netInterface) {
				// Look for IPv4 and non-internal addresses
				if (iface.family === "IPv4" && !iface.internal) {
					// Skip virtual interfaces
					if (
						netInterfaceName.includes("WSL") ||
						netInterfaceName.includes("Virtual") ||
						netInterfaceName.includes("Loopback") ||
						netInterfaceName.includes("VPN") ||
						netInterfaceName.includes("vEthernet")
					) {
						continue;
					}

					// Prioritize addresses in common local network ranges
					// if (iface.address.startsWith('192.168.') ||
					//     iface.address.startsWith('10.') ||
					//     iface.address.match(/^172\.(1[6-9]|2[0-9]|3[0-1])\./)) {
					//   return iface.address;
					// }

					candidates.push(iface.address);
				}
			}
		}
	}

	// If we haven't returned yet, choose the first candidate (if any)
	if (candidates.length > 0) {
		return candidates[0];
	}

	throw new Error("Unable to retrieve local network IP address.");
}

/**
 * Lists all relevant network devices that the app can listen on.
 * Excludes virtual interfaces and returns both interface names and IP addresses.
 *
 * @returns {Array<{interface: string, address: string}>} - Array of network devices with their names and IP addresses.
 */
export function getAllRelevantNetworkDevices(): Array<{
	interface: string;
	address: string;
}> {
	const netInterfaces = os.networkInterfaces();
	const devices: Array<{ interface: string; address: string }> = [];

	for (const netInterfaceName in netInterfaces) {
		const netInterface = netInterfaces[netInterfaceName];
		if (netInterface) {
			for (const iface of netInterface) {
				// Look for IPv4 and non-internal addresses
				if (iface.family === "IPv4" && !iface.internal) {
					// Skip virtual interfaces
					if (
						netInterfaceName.includes("WSL") ||
						netInterfaceName.includes("Virtual") ||
						netInterfaceName.includes("Loopback") ||
						netInterfaceName.includes("VPN") ||
						netInterfaceName.includes("vEthernet")
					) {
						continue;
					}

					devices.push({
						interface: netInterfaceName,
						address: iface.address,
					});
				}
			}
		}
	}

	return devices;
}
