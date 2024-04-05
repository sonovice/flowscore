import { supportsTbody, BROWSER_NOT_SUPPORTED_ERROR } from './DOM/tbody.js';
import DOMEngine from './DOM/Engine.js';
import Layout, { LAYOUT_REASON } from './Layout.js';
import ScrollableContainerResizeHandler from './ScrollableContainerResizeHandler.js';
import BeforeResize from './BeforeResize.js';
import Scroll from './Scroll.js';
import ListHeightMeasurement from './ListHeightMeasurement.js';
import ItemHeights from './ItemHeights.js';
import log, { warn, isDebug, reportError } from './utility/debug.js';
import createStateHelpers from './VirtualScroller.state.js';
import createVerticalSpacingHelpers from './VirtualScroller.verticalSpacing.js';
import createColumnsHelpers from './VirtualScroller.columns.js';
import createLayoutHelpers from './VirtualScroller.layout.js';
import createOnRenderHelpers from './VirtualScroller.onRender.js';
import createScrollableContainerResizeHelpers from './VirtualScroller.onContainerResize.js';
import createItemsHelpers from './VirtualScroller.items.js';
/**
 * @param  {function} getItemsContainerElement — Returns the container DOM `Element`.
 * @param  {any[]} items — The list of items.
 * @param  {Object} [options] — See README.md.
 * @return {VirtualScroller}
 */

export default function VirtualScrollerConstructor(getItemsContainerElement, items) {
  var _this = this;

  var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
  var render = options.render,
      state = options.state,
      _options$getInitialIt = options.getInitialItemState,
      getInitialItemState = _options$getInitialIt === void 0 ? function () {} : _options$getInitialIt,
      onStateChange = options.onStateChange,
      initialScrollPosition = options.initialScrollPosition,
      onScrollPositionChange = options.onScrollPositionChange,
      scrollableContainer = options.scrollableContainer,
      _options$measureItems = options.measureItemsBatchSize,
      measureItemsBatchSize = _options$measureItems === void 0 ? 50 : _options$measureItems,
      getColumnsCount = options.getColumnsCount,
      getItemId = options.getItemId,
      tbody = options.tbody,
      estimatedItemHeight = options.estimatedItemHeight,
      getEstimatedVisibleItemRowsCount = options.getEstimatedVisibleItemRowsCount,
      onItemInitialRender = options.onItemInitialRender,
      onItemFirstRender = options.onItemFirstRender,
      _useTimeoutInRenderLoop = options._useTimeoutInRenderLoop,
      _waitForScrollingToStop = options._waitForScrollingToStop,
      engine = options.engine;
  var bypass = options.bypass,
      getEstimatedItemHeight = options.getEstimatedItemHeight,
      getScrollableContainer = options.getScrollableContainer;
  log('~ Initialize ~'); // Could support non-DOM rendering engines.
  // For example, React Native, `<canvas/>`, etc.

  this.engine = engine || DOMEngine;

  if (!getEstimatedItemHeight && typeof estimatedItemHeight === 'number') {
    getEstimatedItemHeight = function getEstimatedItemHeight() {
      return estimatedItemHeight;
    };
  } // `scrollableContainer` option is deprecated.
  // Use `getScrollableContainer()` option instead.


  if (!getScrollableContainer && scrollableContainer) {
    getScrollableContainer = function getScrollableContainer() {
      return scrollableContainer;
    };
  } // Sometimes, when `new VirtualScroller()` instance is created,
  // `getItemsContainerElement()` might not be ready to return the "container" DOM Element yet
  // (for example, because it's not rendered yet). That's the reason why it's a getter function.
  // For example, in React `<VirtualScroller/>` component, a `VirtualScroller`
  // instance is created in the React component's `constructor()`, and at that time
  // the container Element is not yet available. The container Element is available
  // in `componentDidMount()`, but `componentDidMount()` is not executed on server,
  // which would mean that React `<VirtualScroller/>` wouldn't render at all
  // on server side, while with the `getItemsContainerElement()` approach, on server side,
  // it still "renders" a list with a predefined amount of items in it by default.
  // (`initiallyRenderedItemsCount`, or `1`).


  this.getItemsContainerElement = getItemsContainerElement; // if (prerenderMargin === undefined) {
  // 	// Renders items which are outside of the screen by this "prerender margin".
  // 	// Is the screen height by default: seems to be the optimal value
  // 	// for "Page Up" / "Page Down" navigation and optimized mouse wheel scrolling.
  // 	prerenderMargin = this.scrollableContainer ? this.scrollableContainer.getHeight() : 0
  // }

  if (options.getState || options.setState) {
    throw new Error('[virtual-scroller] `getState`/`setState` options usage has changed in the new version. See the readme for more details.');
  } // Work around `<tbody/>` not being able to have `padding`.
  // https://gitlab.com/catamphetamine/virtual-scroller/-/issues/1


  if (tbody) {
    if (this.engine !== DOMEngine) {
      throw new Error('[virtual-scroller] `tbody` option is only supported for DOM rendering engine');
    }

    log('~ <tbody/> detected ~');
    this.tbody = true;

    if (!supportsTbody()) {
      log('~ <tbody/> not supported ~');
      reportError(BROWSER_NOT_SUPPORTED_ERROR);
      bypass = true;
    }
  }

  if (bypass) {
    log('~ "bypass" mode ~');
  } // In `bypass` mode, `VirtualScroller` doesn't wait
  // for the user to scroll down to render all items:
  // instead, it renders all items right away, as if
  // the list is rendered without using `VirtualScroller`.
  // It was added just to measure how much is the
  // performance difference between using a `VirtualScroller`
  // and not using a `VirtualScroller`.
  // It turned out that unmounting large React component trees
  // is a very long process, so `VirtualScroller` does seem to
  // make sense when used in a React application.


  this.bypass = bypass; // this.bypassBatchSize = bypassBatchSize || 10
  // Using `setTimeout()` in render loop is a workaround
  // for avoiding a React error message:
  // "Maximum update depth exceeded.
  //  This can happen when a component repeatedly calls
  //  `.setState()` inside `componentWillUpdate()` or `componentDidUpdate()`.
  //  React limits the number of nested updates to prevent infinite loops."

  this._useTimeoutInRenderLoop = _useTimeoutInRenderLoop;

  if (getItemId) {
    this.isItemEqual = function (a, b) {
      return getItemId(a) === getItemId(b);
    };
  } else {
    this.isItemEqual = function (a, b) {
      return a === b;
    };
  }

  if (onItemInitialRender) {
    this.onItemInitialRender = onItemInitialRender;
  } // `onItemFirstRender(i)` is deprecated, use `onItemInitialRender(item)` instead.
  else if (onItemFirstRender) {
    this.onItemInitialRender = function (item) {
      warn('`onItemFirstRender(i)` is deprecated, use `onItemInitialRender(item)` instead.');

      var _this$getState = _this.getState(),
          items = _this$getState.items;

      var i = items.indexOf(item); // The `item` could also be non-found due to the inconsistency bug:
      // The reason is that `i` can be non-consistent with the `items`
      // passed to `<VirtualScroller/>` in React due to `updateState()` not being
      // instanteneous: when new `items` are passed to `<VirtualScroller/>`,
      // `VirtualScroller.updateState({ items })` is called, and if `onItemFirstRender(i)`
      // is called after the aforementioned `updateState()` is called but before it finishes,
      // `i` would point to an index in "previous" `items` while the application
      // would assume that `i` points to an index in the "new" `items`,
      // resulting in an incorrect item being assumed by the application
      // or even in an "array index out of bounds" error.

      if (i >= 0) {
        onItemFirstRender(i);
      }
    };
  } // If initial `state` is passed then use `items` from `state`
  // instead of the `items` argument.


  if (state) {
    items = state.items;
  }

  log('Items count', items.length);

  if (getEstimatedItemHeight) {
    log('Estimated item height', getEstimatedItemHeight());
  }

  createStateHelpers.call(this, {
    state: state,
    getInitialItemState: getInitialItemState,
    onStateChange: onStateChange,
    render: render,
    items: items
  });
  createVerticalSpacingHelpers.call(this);
  createColumnsHelpers.call(this, {
    getColumnsCount: getColumnsCount
  });
  createLayoutHelpers.call(this);
  createOnRenderHelpers.call(this);
  createScrollableContainerResizeHelpers.call(this);
  createItemsHelpers.call(this);
  createHelpers.call(this, {
    getScrollableContainer: getScrollableContainer,
    getEstimatedItemHeight: getEstimatedItemHeight,
    getEstimatedVisibleItemRowsCount: getEstimatedVisibleItemRowsCount,
    measureItemsBatchSize: measureItemsBatchSize,
    initialScrollPosition: initialScrollPosition,
    onScrollPositionChange: onScrollPositionChange,
    waitForScrollingToStop: _waitForScrollingToStop
  });

  if (state) {
    // Initialize `ItemHeights` from previously measured `state.itemHeights`.
    this.itemHeights.readItemHeightsFromState(state); // Initialize some `BeforeResize` internal flags from a previously saved state.

    this.beforeResize.initializeFromState(state);
  }
}

function createHelpers(_ref) {
  var _this2 = this;

  var getScrollableContainer = _ref.getScrollableContainer,
      getEstimatedItemHeight = _ref.getEstimatedItemHeight,
      getEstimatedVisibleItemRowsCount = _ref.getEstimatedVisibleItemRowsCount,
      measureItemsBatchSize = _ref.measureItemsBatchSize,
      initialScrollPosition = _ref.initialScrollPosition,
      onScrollPositionChange = _ref.onScrollPositionChange,
      waitForScrollingToStop = _ref.waitForScrollingToStop;
  this.itemsContainer = this.engine.createItemsContainer(this.getItemsContainerElement); // If the items "container" element is mounted at this stage,
  // remove any accidental text nodes from it (like whitespace).
  //
  // Also, this guards against cases when someone accidentally tries
  // using `VirtualScroller` on a non-empty element.
  //

  if (this.getItemsContainerElement()) {
    this.itemsContainer.clear();
  }

  this.scrollableContainer = this.engine.createScrollableContainer(getScrollableContainer, this.getItemsContainerElement); // Create `ItemHeights` instance.

  this.itemHeights = new ItemHeights({
    container: this.itemsContainer,
    getItemHeight: function getItemHeight(i) {
      return _this2.getState().itemHeights[i];
    },
    setItemHeight: function setItemHeight(i, height) {
      return _this2.getState().itemHeights[i] = height;
    }
  });
  this.layout = new Layout({
    bypass: this.bypass,
    getInitialEstimatedItemHeight: getEstimatedItemHeight,
    getInitialEstimatedVisibleItemRowsCount: getEstimatedVisibleItemRowsCount,
    measureItemsBatchSize: measureItemsBatchSize,
    getPrerenderMargin: function getPrerenderMargin() {
      return _this2.getPrerenderMargin();
    },
    getVerticalSpacing: function getVerticalSpacing() {
      return _this2.getVerticalSpacing();
    },
    getVerticalSpacingBeforeResize: function getVerticalSpacingBeforeResize() {
      return _this2.getVerticalSpacingBeforeResize();
    },
    getColumnsCount: function getColumnsCount() {
      return _this2.getColumnsCount();
    },
    getColumnsCountBeforeResize: function getColumnsCountBeforeResize() {
      return _this2.getState().beforeResize && _this2.getState().beforeResize.columnsCount;
    },
    getItemHeight: function getItemHeight(i) {
      return _this2.getState().itemHeights[i];
    },
    getItemHeightBeforeResize: function getItemHeightBeforeResize(i) {
      return _this2.getState().beforeResize && _this2.getState().beforeResize.itemHeights[i];
    },
    getBeforeResizeItemsCount: function getBeforeResizeItemsCount() {
      return _this2.getState().beforeResize ? _this2.getState().beforeResize.itemHeights.length : 0;
    },
    getAverageItemHeight: function getAverageItemHeight() {
      return _this2.itemHeights.getAverage();
    },
    // `this.scrollableContainer` is gonna be `undefined` during server-side rendering.
    // https://gitlab.com/catamphetamine/virtual-scroller/-/issues/30
    getMaxVisibleAreaHeight: function getMaxVisibleAreaHeight() {
      return _this2.scrollableContainer && _this2.scrollableContainer.getHeight();
    },
    //
    // The "previously calculated layout" feature is not currently used.
    //
    // The current layout snapshot could be stored as a "previously calculated layout" variable
    // so that it could theoretically be used when calculating new layout incrementally
    // rather than from scratch, which would be an optimization.
    //
    getPreviouslyCalculatedLayout: function getPreviouslyCalculatedLayout() {
      return _this2.previouslyCalculatedLayout;
    }
  });
  this.scrollableContainerResizeHandler = new ScrollableContainerResizeHandler({
    bypass: this.bypass,
    getWidth: function getWidth() {
      return _this2.scrollableContainer.getWidth();
    },
    getHeight: function getHeight() {
      return _this2.scrollableContainer.getHeight();
    },
    listenForResize: function listenForResize(listener) {
      return _this2.scrollableContainer.onResize(listener);
    },
    onResizeStart: function onResizeStart() {
      log('~ Scrollable container resize started ~');
      _this2._isResizing = true;
    },
    onResizeStop: function onResizeStop() {
      log('~ Scrollable container resize finished ~');
      _this2._isResizing = undefined;
    },
    onNoChange: function onNoChange() {
      // There might have been some missed `this.onUpdateShownItemIndexes()` calls
      // due to setting `this._isResizing` flag to `true` during the resize.
      // So, update shown item indexes just in case.
      _this2.onUpdateShownItemIndexes({
        reason: LAYOUT_REASON.VIEWPORT_SIZE_UNCHANGED
      });
    },
    onHeightChange: function onHeightChange() {
      return _this2.onUpdateShownItemIndexes({
        reason: LAYOUT_REASON.VIEWPORT_HEIGHT_CHANGED
      });
    },
    onWidthChange: function onWidthChange(prevWidth, newWidth) {
      log('~ Scrollable container width changed from', prevWidth, 'to', newWidth, '~');

      _this2.onContainerResize();
    }
  });
  this.scroll = new Scroll({
    bypass: this.bypass,
    scrollableContainer: this.scrollableContainer,
    itemsContainer: this.itemsContainer,
    waitForScrollingToStop: waitForScrollingToStop,
    onScroll: function onScroll() {
      var _ref2 = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
          delayed = _ref2.delayed;

      _this2.onUpdateShownItemIndexes({
        reason: delayed ? LAYOUT_REASON.STOPPED_SCROLLING : LAYOUT_REASON.SCROLL
      });
    },
    initialScrollPosition: initialScrollPosition,
    onScrollPositionChange: onScrollPositionChange,
    isImmediateLayoutScheduled: function isImmediateLayoutScheduled() {
      return Boolean(_this2.layoutTimer);
    },
    hasNonRenderedItemsAtTheTop: function hasNonRenderedItemsAtTheTop() {
      return _this2.getState().firstShownItemIndex > 0;
    },
    hasNonRenderedItemsAtTheBottom: function hasNonRenderedItemsAtTheBottom() {
      return _this2.getState().lastShownItemIndex < _this2.getItemsCount() - 1;
    },
    getLatestLayoutVisibleArea: function getLatestLayoutVisibleArea() {
      return _this2.latestLayoutVisibleArea;
    },
    getListTopOffset: this.getListTopOffsetInsideScrollableContainer,
    getPrerenderMargin: function getPrerenderMargin() {
      return _this2.getPrerenderMargin();
    }
  });
  this.listHeightMeasurement = new ListHeightMeasurement({
    itemsContainer: this.itemsContainer,
    getListTopOffset: this.getListTopOffsetInsideScrollableContainer
  });

  if (this.engine.watchListTopOffset) {
    this.listTopOffsetWatcher = this.engine.watchListTopOffset({
      getListTopOffset: this.getListTopOffsetInsideScrollableContainer,
      onListTopOffsetChange: function onListTopOffsetChange(_ref3) {
        var reason = _ref3.reason;
        return _this2.onUpdateShownItemIndexes({
          reason: LAYOUT_REASON.TOP_OFFSET_CHANGED
        });
      }
    });
  }

  this.beforeResize = new BeforeResize({
    getState: this.getState,
    getVerticalSpacing: this.getVerticalSpacing,
    getColumnsCount: this.getColumnsCount
  });
}
//# sourceMappingURL=VirtualScroller.constructor.js.map