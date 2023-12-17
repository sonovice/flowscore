import os from "node:os";


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


export function getLocalIp(): string {
  const netInterfaces = os.networkInterfaces();
  for (const netInterfaceName in netInterfaces) {
    const netInterface = netInterfaces[netInterfaceName];
    if (netInterface) {
      for (const iface of netInterface) {
        // Look vor IPv4 and only internal address
        if (iface.family === 'IPv4' && !iface.internal) {
          return iface.address;
        }
      }
    }
  }
  throw new Error('Unable to retrieve local network IP address.');
}