/**
 * Modifies the labels in the MEI (Music Encoding Initiative) string based on the number of systems and whether it's a full score.
 *
 * @param {string} mei - The MEI string to modify.
 * @param {number} numSystems - The number of systems in the score.
 * @param {boolean} isFullScore - Whether the score is a full score.
 * @returns {string} The modified MEI string.
 */
export function modifyLabels(mei: string, numSystems: number, isFullScore: boolean): string {
  // If it's a full score and there are systems
  if (isFullScore) {
    if (numSystems > 0) {
      // Replace the label with the abbreviated label
      mei = mei.replace(/(<staffDef\b[^>]*?)\blabel="[^"]*"\s?([^>]*?label\.abbr="([^"]*)")/g, '$1label="$3" $2');
    }
  } else {
    // Remove the abbreviated label
    mei = mei.replace(/label\.abbr="[^"]*"\s?/g, '');
    if (numSystems > 0) {
      // Remove the label if there are systems
      mei = mei.replace(/label="[^"]*"\s?/g, '');
    }
  }

  // Return the modified MEI string
  return mei;
}