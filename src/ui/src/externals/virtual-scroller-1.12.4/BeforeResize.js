function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { _defineProperty(target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); Object.defineProperty(Constructor, "prototype", { writable: false }); return Constructor; }

import log from './utility/debug.js';

var BeforeResize = /*#__PURE__*/function () {
  function BeforeResize(_ref) {
    var getState = _ref.getState,
        getVerticalSpacing = _ref.getVerticalSpacing,
        getColumnsCount = _ref.getColumnsCount;

    _classCallCheck(this, BeforeResize);

    this.getState = getState;
    this.getVerticalSpacing = getVerticalSpacing;
    this.getColumnsCount = getColumnsCount;
  }

  _createClass(BeforeResize, [{
    key: "initializeFromState",
    value: function initializeFromState(state) {
      this._includesBeforeResizeInState = Boolean(state.beforeResize);
    } // Cleans up "before resize" item heights and adjusts the scroll position accordingly.
    //
    // Hypothetically, it could also wait for the user to stop scrolling and only then
    // adjust the scroll position. The rationale is that if `window.scrollTo()` is called
    // while the user is scrolling, the user would occasionally experience "lost" mouse wheel
    // events when scrolling with a mouse wheel.
    //
    // Seems like Twitter's website waits for the user to stop scrolling before applying
    // the scroll position correction after a window resize. This library could do that too,
    // but that would require rewriting "before items height" top padding calculation
    // so that it doesn't re-calculate it on every re-render and instead does so incrementally,
    // and then, when the user stops, it re-calculates it from scratch removing the error
    // and adjusting the scroll position accordingly so that there's no "jump of content".
    //
    // But, seems like it works fine as it is and there's no need to rewrite anything.
    //

  }, {
    key: "cleanUpBeforeResizeItemHeights",
    value: function cleanUpBeforeResizeItemHeights() {
      var _this$getState = this.getState(),
          firstShownItemIndex = _this$getState.firstShownItemIndex,
          lastShownItemIndex = _this$getState.lastShownItemIndex,
          itemHeights = _this$getState.itemHeights,
          beforeResize = _this$getState.beforeResize; // If there're "before resize" properties in `state`
      // then it means that the corresponding items are waiting to be
      // re-measured after container resize. Since the resize,
      // some of those non-re-measured items might have just been measured,
      // so see if that's true, and if it is, remove those now-obsolete
      // "before resize" item heights and ajust the scroll position
      // so that there's no "content jumping".


      if (beforeResize) {
        // If the user has scrolled up to reveal a previously hidden item
        // that has not yet been re-measured after a previous resize.
        if (firstShownItemIndex < beforeResize.itemHeights.length) {
          log('~ Clean up "before resize" item heights and correct scroll position ~'); // Some of the "before" items have been un-hidden and re-measured.
          // Un-hiding those items would result in a "jump of content"
          // because "before resize" heights of those un-hidden items
          // could (and most likely will) be different from the current ones,
          // or because "before resize" columns count is different from
          // the current one.
          // To prevent a "jump of content", calculate the scroll position
          // difference and adjust the scroll position.
          // The height of the item rows that have transitioned
          // from hidden to shown.

          var newlyShownItemRowsHeight = 0; // Some of the `itemHeights` between the current `firstShownItemIndex` and
          // the previous `firstShownItemIndex` could stay `undefined` if the user
          // scrolled "abruptly": for example, by using a `window.scrollTo()` call.
          // In that case, the items below the visible ones won't be rendered and measured.
          // In such case, limit the items being iterated over to the current `lastShownItemIndex`
          // rather than the previous `firstShownItemIndex`.

          var prevFirstReMeasuredItemsRowIndex = Math.floor(beforeResize.itemHeights.length / this.getColumnsCount());
          var newlyShownItemsToIndex = Math.min(prevFirstReMeasuredItemsRowIndex * this.getColumnsCount() - 1, lastShownItemIndex);
          var i = firstShownItemIndex;

          while (i <= newlyShownItemsToIndex) {
            // Calculate newly shown row height.
            var rowHeight = 0;
            var columnIndex = 0;

            while (columnIndex < this.getColumnsCount() && i <= newlyShownItemsToIndex) {
              var itemHeight = itemHeights[i];

              if (itemHeight === undefined) {
                // `itemHeight` can only be `undefined` when not `beforeResize`.
                // Use the current "average item height" as a substitute.
                itemHeight = this.getAverageItemHeight();
              }

              rowHeight = Math.max(rowHeight, itemHeight);
              i++;
              columnIndex++;
            } // Append to the total "newly shown item rows height".


            newlyShownItemRowsHeight += rowHeight;
            newlyShownItemRowsHeight += this.getVerticalSpacing();
          } // The height of the "before resize" item rows
          // that will be "cleaned up" in this function call.


          var cleanedUpBeforeResizeItemRowsHeight = 0; // Some of the `beforeResize` item rows might have been skipped if the user
          // scrolled up "abruptly": for example, by using a `window.scrollTo()` call.
          // In that case, the "before resize" items below the bottom border of the screen
          // shouldn't be accounted for when calculating the scrollbar adjustment shift
          // because items after `lastShownItemIndex` aren't participating in the calculation
          // of `newlyShownItemRowsHeight`.

          var maxParticipatingBeforeResizeItemsCount = Math.min(beforeResize.itemHeights.length, lastShownItemIndex + 1);
          var participatingBeforeResizeItemRowsCount = Math.ceil(maxParticipatingBeforeResizeItemsCount / beforeResize.columnsCount);
          var firstCleanedUpBeforeResizeItemsRowIndex = firstShownItemIndex === 0 ? 0 : Math.floor((firstShownItemIndex - 1) / beforeResize.columnsCount) + 1;
          var k = firstCleanedUpBeforeResizeItemsRowIndex;

          while (k < participatingBeforeResizeItemRowsCount) {
            var _rowHeight = beforeResize.itemHeights[k * beforeResize.columnsCount];
            cleanedUpBeforeResizeItemRowsHeight += _rowHeight;
            cleanedUpBeforeResizeItemRowsHeight += beforeResize.verticalSpacing;
            k++;
          } // Schedule an asynchronous `this.updateState()` call that will update
          // `beforeResize` property of `state`. Ideally, it should be updated
          // immediately, but since `this.updateState()` calls are asynchronous,
          // the code updates just the underlying `beforeResize.itemHeights`
          // array immediately instead, which is still a hack but still a lesser one.


          if (firstShownItemIndex === 0) {
            log('Drop all "before resize" item heights');
          } else {
            var firstDroppedBeforeResizeItemIndex = firstShownItemIndex;
            var lastDroppedBeforeResizeItemIndex = beforeResize.itemHeights.length - 1;

            if (firstDroppedBeforeResizeItemIndex === lastDroppedBeforeResizeItemIndex) {
              log('For item index', firstDroppedBeforeResizeItemIndex, '— drop "before resize" height', beforeResize.itemHeights[firstDroppedBeforeResizeItemIndex]);
            } else {
              log('For item indexes from', firstDroppedBeforeResizeItemIndex, 'to', lastDroppedBeforeResizeItemIndex, '— drop "before resize" heights', beforeResize.itemHeights.slice(firstDroppedBeforeResizeItemIndex));
            }
          } // Immediately update `beforeResize.itemHeights`
          // so that the component isn't left in an inconsistent state
          // before a `this.updateState()` call below is applied.


          beforeResize.itemHeights.splice(firstShownItemIndex, beforeResize.itemHeights.length - firstShownItemIndex); // Return the "scroll by" amount that would correct the scroll position.
          // Also return a state update.

          return {
            scrollBy: newlyShownItemRowsHeight - cleanedUpBeforeResizeItemRowsHeight,
            beforeResize: firstShownItemIndex === 0 ? undefined : _objectSpread({}, beforeResize)
          };
        }
      }
    } // Snapshots "before resize" values in order to preserve the currently
    // shown items' vertical position on screen so that there's no "content jumping".
    //
    // `newFirstShownItemIndex` is `> 0`.
    //

  }, {
    key: "snapshotBeforeResizeItemHeights",
    value: function snapshotBeforeResizeItemHeights(_ref2) {
      var firstShownItemIndex = _ref2.firstShownItemIndex,
          newFirstShownItemIndex = _ref2.newFirstShownItemIndex,
          newColumnsCount = _ref2.newColumnsCount;
      var columnsCount = this.getColumnsCount();
      var verticalSpacing = this.getVerticalSpacing();
      this._includesBeforeResizeInState = true;

      var _this$getState2 = this.getState(),
          prevBeforeResize = _this$getState2.beforeResize,
          itemHeights = _this$getState2.itemHeights;

      var prevBeforeResizeItemsCount = prevBeforeResize ? prevBeforeResize.itemHeights.length : 0; // If there already are "before resize" values in `state`
      // then it means that those should be merged with the new ones.
      //
      // `beforeResize.itemHeights` could be empty in an edge case
      // when there's a pending state update that sets `beforeResize`
      // to `undefined`, and in that case empty `beforeResize.itemHeights`
      // signals about that type of a situation.
      //

      if (prevBeforeResizeItemsCount > 0) {
        // Because the "previous" before resize values might have been captured
        // for a window width corresponding to a layout with a different columns count
        // and different vertical spacing, re-calculate those item heights as if
        // they corresponded to the current columns count and current vertical spacing,
        // since "previous" and "new" before resize item heights are gonna be merged.
        if (prevBeforeResize.columnsCount !== columnsCount || prevBeforeResize.verticalSpacing !== verticalSpacing) {
          var prevBeforeResizeBeforeItemsHeight = 0;
          var prevBeforeResizeItemRowsCount = Math.ceil(prevBeforeResizeItemsCount / prevBeforeResize.columnsCount);
          var rowIndex = 0;

          while (rowIndex < prevBeforeResizeItemRowsCount) {
            // Since all "before resize" item heights are equal within a row,
            // the height of the first "before resize" item in a row is that row's height.
            var rowHeight = prevBeforeResize.itemHeights[rowIndex * prevBeforeResize.columnsCount];
            prevBeforeResizeBeforeItemsHeight += rowHeight;
            prevBeforeResizeBeforeItemsHeight += prevBeforeResize.verticalSpacing;
            rowIndex++;
          }

          var newBeforeResizeAdditionalBeforeItemsHeight = 0;
          var i = firstShownItemIndex;

          while (i < newFirstShownItemIndex) {
            var _rowHeight2 = 0;
            var k = 0;

            while (k < columnsCount && i < newFirstShownItemIndex) {
              _rowHeight2 = Math.max(_rowHeight2, itemHeights[i]);
              k++;
              i++;
            }

            newBeforeResizeAdditionalBeforeItemsHeight += _rowHeight2;
            newBeforeResizeAdditionalBeforeItemsHeight += verticalSpacing;
          }

          var newBeforeResizeBeforeItemsHeight = prevBeforeResizeBeforeItemsHeight + newBeforeResizeAdditionalBeforeItemsHeight;
          var newBeforeResizeBeforeItemRowsCount = Math.ceil(newFirstShownItemIndex / columnsCount);
          return new Array(newFirstShownItemIndex).fill( // Re-calculate "before resize" item heights so that "previous" and "new" ones
          // correspond to the same (new) columns count.
          // Also don't occasionally set item heights to `< 0`.
          Math.max(0, newBeforeResizeBeforeItemsHeight / newBeforeResizeBeforeItemRowsCount - verticalSpacing));
        } else {
          // Add new item heights to the previously snapshotted ones.
          return prevBeforeResize.itemHeights.concat(equalizeItemHeights(itemHeights, newFirstShownItemIndex, columnsCount).slice(prevBeforeResize.itemHeights.length));
        }
      } else {
        return equalizeItemHeights(itemHeights, newFirstShownItemIndex, columnsCount);
      }
    }
  }, {
    key: "shouldIncludeBeforeResizeValuesInState",
    value: function shouldIncludeBeforeResizeValuesInState() {
      return this._includesBeforeResizeInState;
    }
  }]);

  return BeforeResize;
}(); // Equalizes all item heights within a given row, for each row.
//
// The reason is that `beforeResize.itemHeights` is not necessarily divisible by
// `beforeResize.columnsCount`, which would result in varying last row height
// as items get removed from `beforeResize.itemHeights` as the user scrolls up.
//
// By equalizing all item heights within a given row, for each row, such "jumping"
// last "before resize" row height is prevented when the user scrolls up.
//


export { BeforeResize as default };

function equalizeItemHeights(itemHeights, maxItemsCount, columnsCount) {
  itemHeights = itemHeights.slice(0, Math.ceil(maxItemsCount / columnsCount) * columnsCount);
  var rowIndex = 0;

  while (rowIndex * columnsCount < maxItemsCount) {
    // Calculate row height.
    var rowHeight = 0;
    var k = 0;

    while (k < columnsCount) {
      rowHeight = Math.max(rowHeight, itemHeights[rowIndex * columnsCount + k]);
      k++;
    } // Equalize all item heights within the row.


    k = 0;

    while (k < columnsCount) {
      itemHeights[rowIndex * columnsCount + k] = rowHeight;
      k++;
    } // Proceed with the next row.


    rowIndex++;
  }

  return itemHeights.slice(0, maxItemsCount);
}

export function cleanUpBeforeResizeState(state) {
  if (state.beforeResize) {
    if (state.beforeResize.itemHeights.length === 0) {
      state.beforeResize = undefined;
    }
  }

  return state;
}
//# sourceMappingURL=BeforeResize.js.map