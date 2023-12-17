import {select} from "xpath";
import {DOMParser} from 'xmldom';

const parser = new DOMParser();

function hasElementChildren(node: Node) {
  for (let i = 0; i < node.childNodes.length; i++) {
    if (node.childNodes[i].nodeType === 1) {
      return true;
    }
  }
  return false;
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