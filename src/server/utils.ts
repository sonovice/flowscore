import {DOMParser} from 'xmldom';
import {select} from 'xpath';

function compareStaffNums(a: string, b: string): number {
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

export function splitMei(fullMei: string, staves: string): string {
  if (staves == 'all' || !staves) {
    return fullMei;
  }

  const parser = new DOMParser();
  const mei = parser.parseFromString(fullMei, 'application/xml');
  const stavesSplitted = staves.split(',');
  (select(`//*[local-name()="staff"]`, mei) as Node[]).forEach(staff => {
    const n = (staff as Element).getAttribute('n');
    if (n && !stavesSplitted.includes(n)) {
      staff.parentNode!.removeChild(staff)
    }
  });
  return mei.toString();
}