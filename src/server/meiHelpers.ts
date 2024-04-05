import {select} from "xpath";
import {DOMParser} from 'xmldom';

const parser = new DOMParser();

/**
 * Checks if an (XML) element has child elements.
 *
 * @param {Element} element - The element to check.
 * @returns {boolean} - True if the element has child elements, false otherwise.
 */
function hasElementChildren(element: Element) {
  for (let i = 0; i < element.childNodes.length; i++) {
    if (element.childNodes[i].nodeType === 1) {
      return true;
    }
  }
  return false;
}

/**
 * Cleans the MEI string by removing <meiHead>, <pgHead> and <pgFoot>.
 *
 * @param {string} meiString - The MEI string to clean.
 * @returns {string} - The cleaned MEI string.
 */
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

/**
 * Recursively removes empty staffGrp elements from the given element.
 *
 * @param {Element} element - The element to remove empty staffGrp elements from.
 */
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

/**
 * Removes all staff elements from an MEI string that are not in the list of desired staves.
 *
 * @param {string} meiString - The MEI string to process.
 * @param {string} staves - The staves to filter by.
 * @returns {String} The MEI string with the undesired staves removed.
 */
export function filterStaves(meiString: string, staves: string): String {
  // If all staves are requested, return the MEI string as is
  if (staves === 'all' || staves === '' || !staves) {
    return meiString;
  }

  const mei = parser.parseFromString(meiString)
  const stavesSplitted = staves.split(',');

  // Remove all undesired <staffDef> elements
  (select(`//*[local-name()="staffDef"]`, mei) as Element[]).forEach(staffDef => {
    const n = staffDef.getAttribute('n');
    if (n && !stavesSplitted.includes(n)) {
      staffDef.parentNode!.removeChild(staffDef);
    }
  });

  // Remove empty <staffGrp> elements
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

  // Remove all elements with @staff attributes that do not match the desired staves
  (select(`//*[@staff]`, mei) as Element[]).forEach(elem => {
    const n = elem.getAttribute('staff');
    if (n && !stavesSplitted.includes(n)) {
      elem.parentNode!.removeChild(elem)
    }
  });

  return mei.toString();
}