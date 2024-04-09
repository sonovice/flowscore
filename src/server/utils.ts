import os from "node:os";

// Color constants for console output
export const COLOR_RESET = '\x1b[0m';
export const COLOR_RED = '\x1b[31m';
export const COLOR_GREEN = '\x1b[32m';
export const COLOR_YELLOW = '\x1b[33m';
export const COLOR_BLUE = '\x1b[34m';
export const COLOR_RED_BOX = '\x1b[41m\x1b[97m';
export const COLOR_GREEN_BOX = '\x1b[42m\x1b[97m';

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
 * Displays the number of clients connected to each staff.
 * The staff numbers are sorted and displayed along with a bar representation of the count.
 *
 * @param {any} subscribedStaves - An object where the keys are staff numbers and the values are the count of clients connected to that staff.
 */
export function displayClients(subscribedStaves: any) {
  console.clear();
  // @ts-ignore
  const totalCount = Object.values(subscribedStaves).reduce((a, b) => a + b, 0);
  console.log(`Connected clients (${totalCount})`);
  console.log("=================");
  const sortedStaffNums = Object.keys(subscribedStaves).sort(compareNumbers);
  sortedStaffNums.forEach(staffNum => {
    const count = subscribedStaves[staffNum];
    const bar = '█'.repeat(count);
    console.log(`Staff ${staffNum}:\t${bar} (${count})`);
  });
}

/**
 * Retrieves the local IP address of the machine.
 * It skips virtual interfaces and looks for an IPv4 address that is not internal.
 *
 * @returns {string} - The local IP address.
 * @throws {Error} - If unable to retrieve the local network IP address.
 */
export function getLocalIp(): string {
  const netInterfaces = os.networkInterfaces();
  for (const netInterfaceName in netInterfaces) {
    // Skip virtual interfaces
    if (netInterfaceName.includes('WSL') || netInterfaceName.includes('Virtual') || netInterfaceName.includes('Loopback') || netInterfaceName.includes('VPN') || netInterfaceName.includes('vEthernet')) {
      continue;
    }
    const netInterface = netInterfaces[netInterfaceName];
    if (netInterface) {
      for (const iface of netInterface) {
        // Look for IPv4 and only internal address
        if (iface.family === 'IPv4' && !iface.internal) {
          return iface.address;
        }
      }
    }
  }
  throw new Error('Unable to retrieve local network IP address.');
}