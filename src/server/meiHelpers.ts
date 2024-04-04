import {select} from "xpath";
import {DOMParser} from 'xmldom';

const parser = new DOMParser();

function hasElementChildren(element: Element) {
  for (let i = 0; i < element.childNodes.length; i++) {
    if (element.childNodes[i].nodeType === 1) {
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

function removeEmptyStaffGrps(element: Element) {
  const staffGrps = select(`.//*[local-name()="staffGrp"]`, element) as Element[];
  staffGrps.forEach(staffGrp => {
    if (!hasElementChildren(staffGrp)) {
      staffGrp.parentNode!.removeChild(staffGrp);
    } else {
      removeEmptyStaffGrps(staffGrp);
    }
  });
}

export function splitMei(meiString: string, staves: string): Document {
  const mei = parser.parseFromString(meiString)

  if (staves == 'all' || !staves) {
    return mei;
  }

  const stavesSplitted = staves.split(',');

  // Remove all undesired <staffDef> elements
  (select(`//*[local-name()="staffDef"]`, mei) as Element[]).forEach(staffDef => {
    const n = staffDef.getAttribute('n');
    if (n && !stavesSplitted.includes(n)) {
      staffDef.parentNode!.removeChild(staffDef);
    }
  });

  removeEmptyStaffGrps(mei.documentElement);

  // Remove @symbol in <staffGrp> if only a single staff is requested
  if (stavesSplitted.length === 1) {
    (select(`//*[local-name()="staffGrp"]`, mei) as Element[]).forEach(staffGrp => {
      staffGrp.removeAttribute('symbol');
    });
  }

  // Remove all undesired <staff> elements
  (select(`//*[local-name()="staff"]`, mei) as Element[]).forEach(staff => {
    const n = staff.getAttribute('n');
    if (n && !stavesSplitted.includes(n)) {
      staff.parentNode!.removeChild(staff)
    }
  });

  // Remove all elements with a @staff attribute that does not match the desired staves
  (select(`//*[@staff]`, mei) as Element[]).forEach(elem => {
    const n = elem.getAttribute('staff');
    if (n && !stavesSplitted.includes(n)) {
      elem.parentNode!.removeChild(elem)
    }
  });

  return mei;
}