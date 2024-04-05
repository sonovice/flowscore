/**
 * Checks whether it's an "incremental" items update, and returns the "diff".
 * @param  {any[]} previousItems
 * @param  {any[]} newItems
 * @return {object} [diff]
 */
export default function getItemsDiff(previousItems, newItems, isEqual) {
  var firstPreviousItemIndex = -1;
  var lastPreviousItemIndex = -1;

  if (previousItems.length > 0) {
    firstPreviousItemIndex = findInArray(newItems, previousItems[0], isEqual);

    if (firstPreviousItemIndex >= 0) {
      if (arePreviousItemsPreserved(previousItems, newItems, firstPreviousItemIndex, isEqual)) {
        lastPreviousItemIndex = firstPreviousItemIndex + previousItems.length - 1;
      }
    }
  }

  var isIncrementalUpdate = firstPreviousItemIndex >= 0 && lastPreviousItemIndex >= 0;

  if (isIncrementalUpdate) {
    return {
      prependedItemsCount: firstPreviousItemIndex,
      appendedItemsCount: newItems.length - (lastPreviousItemIndex + 1)
    };
  }
}

function arePreviousItemsPreserved(previousItems, newItems, offset, isEqual) {
  // Check each item of the `previousItems` to determine
  // whether it's an "incremental" items update.
  // (an update when items are prepended or appended)
  var i = 0;

  while (i < previousItems.length) {
    if (newItems.length <= offset + i || !isEqual(newItems[offset + i], previousItems[i])) {
      return false;
    }

    i++;
  }

  return true;
}

function findInArray(array, element, isEqual) {
  var i = 0;

  while (i < array.length) {
    if (isEqual(array[i], element)) {
      return i;
    }

    i++;
  }

  return -1;
}
//# sourceMappingURL=getItemsDiff.js.map