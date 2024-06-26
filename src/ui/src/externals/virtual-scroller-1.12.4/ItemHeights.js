function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); Object.defineProperty(Constructor, "prototype", { writable: false }); return Constructor; }

import log, { warn, isDebug, reportError } from './utility/debug.js';

var ItemHeights = /*#__PURE__*/function () {
  function ItemHeights(_ref) {
    var container = _ref.container,
        itemHeights = _ref.itemHeights,
        getItemHeight = _ref.getItemHeight,
        setItemHeight = _ref.setItemHeight;

    _classCallCheck(this, ItemHeights);

    this.container = container;
    this._get = getItemHeight;
    this._set = setItemHeight;
    this.reset();
  }

  _createClass(ItemHeights, [{
    key: "reset",
    value: function reset() {
      this.measuredItemsHeight = 0; // "First measured item index" variable was introduced
      // because it's not always `0`: when `virtualScroller.setItems()`
      // is called, some items might get prepended, in which case
      // `this.lastMeasuredItemIndex` is updated. If there was no
      // `this.firstMeasuredItemIndex`, then the average item height
      // calculated in `.getAverage()` would be incorrect in the timeframe
      // between `.setItems()` is called and those changes have been rendered.
      // And in that timeframe, `.getAverage()` is used to calculate the "layout":
      // stuff like "before/after items height" and "estimated items count on screen".

      this.firstMeasuredItemIndex = undefined;
      this.lastMeasuredItemIndex = undefined;
    }
    /**
     * Can only be called after a `.reset()` (including new instance creation).
     * Initializes `this.measuredItemsHeight`, `this.firstMeasuredItemIndex`
     * and `this.lastMeasuredItemIndex` instance variables from `VirtualScroller` `state`.
     * These instance variables are used when calculating "average" item height:
     * the "average" item height is simply `this.measuredItemsHeight` divided by
     * `this.lastMeasuredItemIndex` minus `this.firstMeasuredItemIndex` plus 1.
     */

  }, {
    key: "readItemHeightsFromState",
    value: function readItemHeightsFromState(_ref2) {
      var itemHeights = _ref2.itemHeights;
      var i = 0;

      while (i < itemHeights.length) {
        if (itemHeights[i] === undefined) {
          if (this.firstMeasuredItemIndex !== undefined) {
            this.lastMeasuredItemIndex = i - 1;
            break;
          }
        } else {
          if (this.firstMeasuredItemIndex === undefined) {
            this.firstMeasuredItemIndex = i;
          }

          this.measuredItemsHeight += itemHeights[i];
        }

        i++;
      }
    } // Seems to be no longer used.
    // getItemHeight(i, firstShownItemIndex) {
    // 	if (this._get(i)) {
    // 		return this._get(i)
    // 	}
    // 	const itemHeight = this._measureItemHeight(i, firstShownItemIndex)
    // 	if (itemHeight) {
    // 		this._set(i, itemHeight)
    // 		return itemHeight
    // 	}
    // 	return this.getAverage()
    // }

  }, {
    key: "_measureItemHeight",
    value: function _measureItemHeight(i, firstShownItemIndex) {
      return this.container.getNthRenderedItemHeight(i - firstShownItemIndex);
    }
    /**
     * Measures item heights:
     *
     * * For the items that haven't been previously measured,
     *   measures them for the first time.
     *
     * * For the items that have been previoulsy measured,
     *   validate that their previously measured height
     *   is still equal to their current height.
     *   The unequalness may not necessarily be caused by
     *   incorrect use of `virtual-scroller`: there are
     *   also some valid use cases when such unequalness
     *   could happen (see the comments in the code).
     *
     * @param {number} firstShownItemIndex
     * @param {number} lastShownItemIndex
     * @return {number[]} The indexes of the items that have not previously been measured and have been measured now.
     */

  }, {
    key: "measureItemHeights",
    value: function measureItemHeights(firstShownItemIndex, lastShownItemIndex) {
      log('~ Measure item heights ~'); // If no items are rendered, don't measure anything.

      if (firstShownItemIndex === undefined) {
        return;
      } // Reset `this.measuredItemsHeight` if it's not a "continuous" measured items list:
      // if a group of items has been measured previously, and now it has rendered a completely
      // different group of items, and there's a non-measured "gap" between those two groups,
      // then reset `this.measuredItemsHeight` and "first measured"/"last measured" item indexes.
      // For example, this could happen when `.setItems()` prepends a lot of new items.


      if (this.firstMeasuredItemIndex !== undefined) {
        if (firstShownItemIndex > this.lastMeasuredItemIndex + 1 || lastShownItemIndex < this.firstMeasuredItemIndex - 1) {
          // Reset.
          log('Non-measured items gap detected. Reset first and last measured item indexes.');
          this.reset();
        }
      }

      var nonPreviouslyMeasuredItemIndexes = [];
      var previousFirstMeasuredItemIndex = this.firstMeasuredItemIndex;
      var previousLastMeasuredItemIndex = this.lastMeasuredItemIndex;
      var firstMeasuredItemIndexHasBeenUpdated = false;
      var i = firstShownItemIndex;

      while (i <= lastShownItemIndex) {
        // Measure item heights that haven't been measured previously.
        // Don't re-measure item heights that have been measured previously.
        // The rationale is that developers are supposed to manually call
        // `.onItemHeightDidChange()` immediately every time an item's height has changed.
        // If developers don't neglect that rule, item heights won't
        // change unexpectedly.
        if (this._get(i) === undefined) {
          nonPreviouslyMeasuredItemIndexes.push(i);

          var height = this._measureItemHeight(i, firstShownItemIndex);

          log('Item index', i, 'height', height);

          this._set(i, height); // Update average item height calculation variables
          // related to the previously measured items
          // that're above the items currently being shown.
          // It is known to be a "continuous" measured items list,
          // because the code at the start of this function checks that.


          if (previousFirstMeasuredItemIndex === undefined || i < previousFirstMeasuredItemIndex) {
            this.measuredItemsHeight += height; // Update first measured item index.

            if (!firstMeasuredItemIndexHasBeenUpdated) {
              // log('Set first measured item index', i)
              this.firstMeasuredItemIndex = i;
              firstMeasuredItemIndexHasBeenUpdated = true;
            }
          } // Update average item height calculation variables
          // related to the previously measured items
          // that're below the items currently being shown.
          // It is known to be a "continuous" measured items list,
          // because the code at the start of this function checks that.


          if (previousLastMeasuredItemIndex === undefined || i > previousLastMeasuredItemIndex) {
            // If `previousLastMeasuredItemIndex` is `undefined`
            // then `previousFirstMeasuredItemIndex` is also `undefined`
            // which means that the item's `height` has already been added
            // to `this.measuredItemsHeight` in the code above,
            // so this condition guards against counting the item's `height`
            // twice in `this.measuredItemsHeight`.
            if (previousLastMeasuredItemIndex !== undefined) {
              // Add newly shown item height.
              this.measuredItemsHeight += height;
            } // Update last measured item index.


            this.lastMeasuredItemIndex = i;
          }
        } else {
          // Validate that the item's height didn't change since it was last measured.
          // If it did, then display a warning and update the item's height
          // as an attempt to fix things.
          // If an item's height changes unexpectedly then it means that there'll
          // likely be "content jumping".
          var previousHeight = this._get(i);

          var _height = this._measureItemHeight(i, firstShownItemIndex);

          if (previousHeight !== _height) {
            warn('Item index', i, 'height changed unexpectedly: it was', previousHeight, 'before, but now it is', _height, '. Whenever an item\'s height changes for whatever reason, a developer must call `onItemHeightDidChange(i)` right after that change. If you are calling `onItemHeightDidChange(i)` correctly, then there\'re several other possible causes. For example, perhaps you forgot to persist the item\'s "state" by calling `setItemState(i, newState)` when that "state" did change, and so the item\'s "state" got lost when the item element was unmounted, which resulted in a different item height when the item was shown again with no previous "state". Or perhaps you\'re running your application in "devleopment" mode and `VirtualScroller` has initially rendered the list before your CSS styles or custom fonts have loaded, resulting in different item height measurements "before" and "after" the page has fully loaded.'); // Update the item's height as an attempt to fix things.

            this._set(i, _height);
          }
        }

        i++;
      } // // Update average item height.
      // this.updateAverageItemHeight()


      return nonPreviouslyMeasuredItemIndexes;
    }
    /**
     * Re-measures item height.
     * @param  {number} i — Item index.
     * @param  {number} firstShownItemIndex
     */

  }, {
    key: "remeasureItemHeight",
    value: function remeasureItemHeight(i, firstShownItemIndex) {
      var previousHeight = this._get(i);

      var height = this._measureItemHeight(i, firstShownItemIndex); // // Because this function is called from `.onItemHeightDidChange()`,
      // // there're no guarantees in which circumstances a developer calls it,
      // // and for which item indexes.
      // // Therefore, to guard against cases of incorrect usage,
      // // this function won't crash anything if the item isn't rendered
      // // or hasn't been previously rendered.
      // if (height !== undefined) {
      // 	reportError(`"onItemHeightDidChange()" has been called for item ${i}, but that item isn't currently rendered.`)
      // 	return
      // }
      // if (previousHeight === undefined) {
      // 	reportError(`"onItemHeightDidChange()" has been called for item ${i}, but that item hasn't been rendered before.`)
      // 	return
      // }


      this._set(i, height);

      this.measuredItemsHeight += height - previousHeight;
      return height;
    } // /**
    //  * "Average" item height is stored as an instance variable.
    //  * For example, for caching, so that it isn't calculated every time it's requested.
    //  * But that would be negligible performance gain, not really worth the extra code.
    //  * Another thing it's stored for as an instance variable is
    //  * keeping "previous" "average" item height, because it can be more precise
    //  * than the newly calculated "average" item height, provided it had
    //  * more "samples" (measured items). The newly calculated average item height
    //  * could get less samples in a scenario when the scroll somehow jumps
    //  * from one position to some other distant position: in that case previous
    //  * "total measured items height" is discarded and the new one is initialized.
    //  * Could such situation happen in real life? I guess, it's unlikely.
    //  * So I'm commenting out this code, but still keeping it just in case.
    //  */
    // updateAverageItemHeight() {
    // 	this.averageItemHeightSamplesCount = this.lastMeasuredItemIndex - this.firstMeasuredItemIndex + 1
    // 	this.averageItemHeight = this.measuredItemsHeight / this.averageItemHeightSamplesCount
    // }
    //
    // /**
    //  * Public API: is called by `VirtualScroller`.
    //  * @return {number}
    //  */
    // getAverage() {
    // 	// Previously measured average item height might still be
    // 	// more precise if it contains more measured items ("samples").
    // 	if (this.previousAverageItemHeight) {
    // 		if (this.previousAverageItemHeightSamplesCount > this.averageItemHeightSamplesCount) {
    // 			return this.previousAverageItemHeight
    // 		}
    // 	}
    // 	return this.averageItemHeight || 0
    // }

    /**
     * Public API: is called by `VirtualScroller`.
     * @return {number}
     */

  }, {
    key: "getAverage",
    value: function getAverage() {
      if (this.lastMeasuredItemIndex === undefined) {
        return 0;
      }

      return this.measuredItemsHeight / (this.lastMeasuredItemIndex - this.firstMeasuredItemIndex + 1);
    }
  }, {
    key: "onPrepend",
    value: function onPrepend(count) {
      if (this.firstMeasuredItemIndex !== undefined) {
        this.firstMeasuredItemIndex += count;
        this.lastMeasuredItemIndex += count;
      }
    }
  }]);

  return ItemHeights;
}();

export { ItemHeights as default };
//# sourceMappingURL=ItemHeights.js.map