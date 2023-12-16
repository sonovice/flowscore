export function modifyLabels(mei: string, numSystems: number, isFullScore: boolean): string {
  if (isFullScore) {
    if (numSystems > 0) {
      mei = mei.replace(/(<staffDef\b[^>]*?)\blabel="[^"]*"\s?([^>]*?label\.abbr="([^"]*)")/g, '$1label="$3" $2');
    }
  } else {
    mei = mei.replace(/label\.abbr="[^"]*"\s?/g, '');
    if (numSystems > 0) {
      mei = mei.replace(/label="[^"]*"\s?/g, '');
    }
  }

  return mei;
}