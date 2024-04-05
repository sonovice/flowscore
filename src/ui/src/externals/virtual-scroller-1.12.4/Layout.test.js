import Layout from './Layout.js';
import Engine from './test/Engine.js';
describe('Layout', function () {
  it('should work', function () {
    var SCREEN_HEIGHT = 400;
    var scrollableContainer = {
      width: 800,
      height: SCREEN_HEIGHT
    };
    var ITEM_WIDTH = scrollableContainer.width;
    var ITEM_HEIGHT = 200;
    var VERTICAL_SPACING = 100;
    var items = new Array(9).fill(ITEM_WIDTH * ITEM_HEIGHT);
    var layout = new Layout({
      getPrerenderMargin: function getPrerenderMargin() {
        return SCREEN_HEIGHT;
      },
      getVerticalSpacing: function getVerticalSpacing() {
        return VERTICAL_SPACING;
      },
      getColumnsCount: function getColumnsCount() {
        return 1;
      },
      getItemHeight: function getItemHeight(i) {
        return items[i] / scrollableContainer.width;
      },
      getBeforeResizeItemsCount: function getBeforeResizeItemsCount() {
        return 0;
      },
      getAverageItemHeight: function getAverageItemHeight() {
        return ITEM_HEIGHT;
      },
      getScrollableContainerHeight: function getScrollableContainerHeight() {
        return scrollableContainer.height;
      }
    }); // Initial render.

    layout.getShownItemIndexes({
      itemsCount: items.length,
      visibleAreaInsideTheList: {
        top: 0,
        bottom: SCREEN_HEIGHT
      }
    }).should.deep.equal({
      firstShownItemIndex: 0,
      lastShownItemIndex: 2
    }); // The first item is almost hidden.

    layout.getShownItemIndexes({
      itemsCount: items.length,
      visibleAreaInsideTheList: {
        top: SCREEN_HEIGHT + ITEM_HEIGHT - 1,
        bottom: SCREEN_HEIGHT + ITEM_HEIGHT - 1 + SCREEN_HEIGHT
      }
    }).should.deep.equal({
      firstShownItemIndex: 0,
      lastShownItemIndex: 4
    }); // The first item is hidden.

    layout.getShownItemIndexes({
      itemsCount: items.length,
      visibleAreaInsideTheList: {
        top: SCREEN_HEIGHT + ITEM_HEIGHT,
        bottom: SCREEN_HEIGHT + ITEM_HEIGHT + SCREEN_HEIGHT
      }
    }).should.deep.equal({
      firstShownItemIndex: 1,
      lastShownItemIndex: 4
    }); // A new item at the bottom is almost visible.

    layout.getShownItemIndexes({
      itemsCount: items.length,
      visibleAreaInsideTheList: {
        top: (ITEM_HEIGHT + VERTICAL_SPACING) * 5 - SCREEN_HEIGHT * 2,
        bottom: (ITEM_HEIGHT + VERTICAL_SPACING) * 5 - SCREEN_HEIGHT
      }
    }).should.deep.equal({
      firstShownItemIndex: 1,
      lastShownItemIndex: 4
    }); // A new item at the bottom is visible.

    layout.getShownItemIndexes({
      itemsCount: items.length,
      visibleAreaInsideTheList: {
        top: (ITEM_HEIGHT + VERTICAL_SPACING) * 5 + 1 - SCREEN_HEIGHT * 2,
        bottom: (ITEM_HEIGHT + VERTICAL_SPACING) * 5 + 1 - SCREEN_HEIGHT
      }
    }).should.deep.equal({
      firstShownItemIndex: 1,
      lastShownItemIndex: 5
    });
  });
  it('should update layout for items incremental change', function () {
    var scrollableContainer = {
      width: 800,
      height: 400
    };
    var ITEM_WIDTH = scrollableContainer.width;
    var ITEM_HEIGHT = 200;
    var items = new Array(9).fill(ITEM_WIDTH * ITEM_HEIGHT);
    var VERTICAL_SPACING = 100;
    var layout = new Layout({
      getPrerenderMargin: function getPrerenderMargin() {
        return scrollableContainer.height;
      },
      getVerticalSpacing: function getVerticalSpacing() {
        return VERTICAL_SPACING;
      },
      getColumnsCount: function getColumnsCount() {
        return 1;
      },
      getItemHeight: function getItemHeight(i) {
        return ITEM_HEIGHT;
      },
      getBeforeResizeItemsCount: function getBeforeResizeItemsCount() {
        return 0;
      },
      getAverageItemHeight: function getAverageItemHeight() {
        return ITEM_HEIGHT;
      },
      getScrollableContainerHeight: function getScrollableContainerHeight() {
        return scrollableContainer.height;
      }
    });
    layout.getLayoutUpdateForItemsDiff({
      firstShownItemIndex: 3,
      lastShownItemIndex: 5,
      beforeItemsHeight: 3 * (ITEM_HEIGHT + VERTICAL_SPACING),
      afterItemsHeight: 3 * (ITEM_HEIGHT + VERTICAL_SPACING)
    }, {
      prependedItemsCount: 5,
      appendedItemsCount: 5
    }, {
      itemsCount: 5 + 5 + items.length,
      columnsCount: 1
    }).should.deep.equal({
      firstShownItemIndex: 5 + 3,
      lastShownItemIndex: 5 + 5,
      beforeItemsHeight: (5 + 3) * (ITEM_HEIGHT + VERTICAL_SPACING),
      afterItemsHeight: (3 + 5) * (ITEM_HEIGHT + VERTICAL_SPACING)
    });
  });
  it('should update layout for items incremental change (rows get rebalanced)', function () {
    var scrollableContainer = {
      width: 800,
      height: 400
    };
    var ITEM_WIDTH = scrollableContainer.width;
    var ITEM_HEIGHT = 400;
    var items = new Array(9).fill(ITEM_WIDTH * ITEM_HEIGHT);
    var VERTICAL_SPACING = 100;
    var layout = new Layout({
      getPrerenderMargin: function getPrerenderMargin() {
        return scrollableContainer.height;
      },
      getVerticalSpacing: function getVerticalSpacing() {
        return VERTICAL_SPACING;
      },
      getColumnsCount: function getColumnsCount() {
        return 4;
      },
      getItemHeight: function getItemHeight() {
        return ITEM_HEIGHT;
      },
      getBeforeResizeItemsCount: function getBeforeResizeItemsCount() {
        return 0;
      },
      getAverageItemHeight: function getAverageItemHeight() {
        return ITEM_HEIGHT;
      },
      getScrollableContainerHeight: function getScrollableContainerHeight() {
        return scrollableContainer.height;
      }
    });
    var shouldResetGridLayout;
    var errors = [];

    global.VirtualScrollerCatchError = function (error) {
      return errors.push(error);
    };

    layout.getLayoutUpdateForItemsDiff({
      firstShownItemIndex: 3,
      lastShownItemIndex: 5,
      beforeItemsHeight: 3 * (ITEM_HEIGHT + VERTICAL_SPACING),
      afterItemsHeight: 3 * (ITEM_HEIGHT + VERTICAL_SPACING)
    }, {
      prependedItemsCount: 5,
      appendedItemsCount: 5
    }, {
      itemsCount: 5 + 5 + items.length,
      columnsCount: 4,
      shouldRestoreScrollPosition: true,
      onResetGridLayout: function onResetGridLayout() {
        return shouldResetGridLayout = true;
      }
    }).should.deep.equal({
      firstShownItemIndex: 0,
      lastShownItemIndex: 5 + 5,
      beforeItemsHeight: 0,
      afterItemsHeight: 5 * (ITEM_HEIGHT + VERTICAL_SPACING)
    });
    global.VirtualScrollerCatchError = undefined;
    errors.length.should.equal(2);
    errors[0].message.should.equal('[virtual-scroller] ~ Prepended items count 5 is not divisible by Columns Count 4 ~');
    errors[1].message.should.equal('[virtual-scroller] Layout reset required');
    shouldResetGridLayout.should.equal(true);
  });
});
//# sourceMappingURL=Layout.test.js.map