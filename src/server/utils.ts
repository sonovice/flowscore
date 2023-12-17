import {DOMParser} from 'xmldom';
import {select} from 'xpath';
import os from "node:os";

const parser = new DOMParser();

function hasElementChildren(node: Node) {
  for (let i = 0; i < node.childNodes.length; i++) {
    if (node.childNodes[i].nodeType === 1) {
      return true;
    }
  }
  return false;
}

export function compareStaffNums(a: string, b: string): number {
  // Hilfsfunktion zum Extrahieren der numerischen Teile
  const extractNumbers = (str: string) => (str.match(/\d+/g) || []).map(Number);

  const numsA = extractNumbers(a);
  const numsB = extractNumbers(b);

  const minLength = Math.min(numsA.length, numsB.length);

  for (let i = 0; i < minLength; i++) {
    if (numsA[i] !== numsB[i]) {
      return numsA[i] - numsB[i];
    }
  }

  // Wenn alle verglichenen Teile gleich sind, kürzere Zeichenkette zuerst sortieren
  if (numsA.length !== numsB.length) {
    return numsA.length - numsB.length;
  }

  // Als Fallback, falls keine Zahlen gefunden wurden, lexikalische Sortierung
  return a.localeCompare(b);
}


export function displayClients(subscribedStaves: any) {
  console.clear();
  // @ts-ignore
  const totalCount = Object.values(subscribedStaves).reduce((a, b) => a + b, 0);
  console.log(`Connected clients (${totalCount})`);
  console.log("=================");
  const sortedStaffNums = Object.keys(subscribedStaves).sort(compareStaffNums);
  sortedStaffNums.forEach(staffNum => {
    const count = subscribedStaves[staffNum];
    const bar = '█'.repeat(count);
    console.log(`Staff ${staffNum}:\t${bar} (${count})`);
  });
}

export function cleanMei(meiString: string): string {
  const mei = parser.parseFromString(meiString, 'application/xml');
  const elementsToRemove = select('(//*[local-name()="meiHead"] | //*[local-name()="pgHead"] | //*[local-name()="pgFoot"])', mei) as Node[];
  elementsToRemove.forEach(elem => {
    if (elem.parentNode) {
      elem.parentNode.removeChild(elem);
    }
  });

  return mei.toString();
}

export function splitMei(meiString: string, staves: string): Document {
  const mei = parser.parseFromString(meiString)

  if (staves == 'all' || !staves) {
    return mei;
  }

  const stavesSplitted = staves.split(',');

  // Remove all undesired <staffDef> and <staffGrp> elements
  (select(`//*[local-name()="staffGrp"]`, mei) as Node[]).forEach(staffGrp => {
    (select(`./*[local-name()="staffDef"]`, staffGrp) as Node[]).forEach(staffDef => {
      const n = (staffDef as Element).getAttribute('n');
      if (n && !stavesSplitted.includes(n)) {
        staffDef.parentNode!.removeChild(staffDef);
      }
    });

    if (!hasElementChildren(staffGrp)) {
      staffGrp.parentNode!.removeChild(staffGrp);
    }
  });

  // Remove @symbol in <staffGrp> if only a single staff is requested
  if (stavesSplitted.length === 1) {
    (select(`//*[local-name()="staffGrp"]`, mei) as Node[]).forEach(staffGrp => {
      (staffGrp as Element).removeAttribute('symbol');
    });
  }

  // Remove all undesired <staff> elements
  (select(`//*[local-name()="staff"]`, mei) as Node[]).forEach(staff => {
    const n = (staff as Element).getAttribute('n');
    if (n && !stavesSplitted.includes(n)) {
      staff.parentNode!.removeChild(staff)
    }
  });

  // Remove all elements with a @staff attribute that does not match the desired staves
  (select(`//*[@staff]`, mei) as Node[]).forEach(elem => {
    const n = (elem as Element).getAttribute('staff');
    if (n && !stavesSplitted.includes(n)) {
      elem.parentNode!.removeChild(elem)
    }
  });

  return mei;
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