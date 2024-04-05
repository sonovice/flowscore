function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); Object.defineProperty(Constructor, "prototype", { writable: false }); return Constructor; }

var ListHeightMeasurement = /*#__PURE__*/function () {
  function ListHeightMeasurement(_ref) {
    var itemsContainer = _ref.itemsContainer,
        getListTopOffset = _ref.getListTopOffset;

    _classCallCheck(this, ListHeightMeasurement);

    this.itemsContainer = itemsContainer;
    this.getListTopOffset = getListTopOffset;
  }
  /**
   * Snapshots the list height while `previousItems` are still rendered,
   * before rendering `newItems`. The list height will be re-measured
   * after the new items have been rendered, yielding the list height difference
   * which is gonna be the amount to scroll vertically in order to restore
   * the previous scroll position. Is only used when prepending items.
   * @param  {any[]} previousItems
   * @param  {any[]} newItems
   * @param  {number} prependedItemsCount
   */


  _createClass(ListHeightMeasurement, [{
    key: "snapshotListHeightBeforeAddingNewItems",
    value: function snapshotListHeightBeforeAddingNewItems(_ref2) {
      var previousItems = _ref2.previousItems,
          newItems = _ref2.newItems,
          prependedItemsCount = _ref2.prependedItemsCount;

      // If there were no items in the list
      // then there's no point in restoring scroll position.
      if (previousItems.length === 0) {
        return;
      } // If no items were prepended then no need to restore scroll position.


      if (prependedItemsCount === 0) {
        return;
      } // The first item is supposed to be shown when the user clicks
      // "Show previous items" button. If it isn't shown though,
      // could still calculate the first item's top position using
      // the values from `itemHeights` and `verticalSpacing`.
      // But that would be a weird non-realistic scenario.
      // if (firstShownItemIndex > 0) {
      // 	let i = firstShownItemIndex - 1
      // 	while (i >= 0) {
      // 		firstItemTopOffset += itemHeights[i] + verticalSpacing
      // 		i--
      // 	}
      // }
      // This part is longer relevant: <ReactVirtualScroller/> no longer calls
      // this function two times consequtively.
      //
      // // If the scroll position has already been captured for restoration,
      // // then don't capture it the second time.
      // if (this._snapshot &&
      // 	this._snapshot.previousItems === previousItems &&
      // 	this._snapshot.newItems === newItems) {
      // 	return
      // }


      this._snapshot = {
        previousItems: previousItems,
        newItems: newItems,
        itemIndex: prependedItemsCount,
        itemTopOffset: this.itemsContainer.getNthRenderedItemTopOffset(0),
        // Snapshot list top offset inside the scrollable container too
        // because it's common to hide the "Show previous items" button
        // when the user has browsed to the top of the list, which causes
        // the list's top position to shift upwards due to the button
        // no longer being rendered. Tracking list top offset doesn't
        // fit here that well, but it makes sense in real-world applications.
        listTopOffset: this.getListTopOffset()
      };
    }
  }, {
    key: "getAnchorItemIndex",
    value: function getAnchorItemIndex() {
      return this._snapshot.itemIndex;
    }
  }, {
    key: "hasSnapshot",
    value: function hasSnapshot() {
      return this._snapshot !== undefined;
    }
  }, {
    key: "getListBottomOffsetChange",
    value: function getListBottomOffsetChange() {
      var _this$_snapshot = this._snapshot,
          itemIndex = _this$_snapshot.itemIndex,
          itemTopOffset = _this$_snapshot.itemTopOffset,
          listTopOffset = _this$_snapshot.listTopOffset; // `firstShownItemIndex` is supposed to be `0` at this point,
      // so `renderedElementIndex` would be the same as the `itemIndex`.

      var itemTopOffsetNew = this.itemsContainer.getNthRenderedItemTopOffset(itemIndex);
      var listTopOffsetNew = this.getListTopOffset();
      return itemTopOffsetNew - itemTopOffset + (listTopOffsetNew - listTopOffset);
    }
  }, {
    key: "reset",
    value: function reset() {
      this._snapshot = undefined;
    }
  }]);

  return ListHeightMeasurement;
}();

export { ListHeightMeasurement as default };
//# sourceMappingURL=ListHeightMeasurement.js.map