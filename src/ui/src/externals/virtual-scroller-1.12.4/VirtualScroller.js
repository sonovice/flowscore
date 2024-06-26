function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { _defineProperty(target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); Object.defineProperty(Constructor, "prototype", { writable: false }); return Constructor; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

import VirtualScrollerConstructor from './VirtualScroller.constructor.js';
import { hasTbodyStyles, addTbodyStyles } from './DOM/tbody.js';
import { LAYOUT_REASON } from './Layout.js';
import log, { warn } from './utility/debug.js';

var VirtualScroller = /*#__PURE__*/function () {
  /**
   * @param  {function} getItemsContainerElement — Returns the container DOM `Element`.
   * @param  {any[]} items — The list of items.
   * @param  {Object} [options] — See README.md.
   * @return {VirtualScroller}
   */
  function VirtualScroller(getItemsContainerElement, items) {
    var _this = this;

    var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

    _classCallCheck(this, VirtualScroller);

    _defineProperty(this, "stop", function () {
      if (!_this._isActive) {
        throw new Error('[virtual-scroller] Can\'t stop a `VirtualScroller` that hasn\'t been started');
      }

      _this._isActive = false;
      log('~ Stop ~');

      _this.scrollableContainerResizeHandler.stop();

      _this.scroll.stop(); // Stop `ListTopOffsetWatcher` if it has been started.
      // There seems to be no need to restart `ListTopOffsetWatcher`.
      // It's mainly a hacky workaround for development mode anyway.


      if (_this.listTopOffsetWatcher && _this.listTopOffsetWatcher.isStarted()) {
        _this.listTopOffsetWatcher.stop();
      } // Cancel any scheduled layout.


      _this.cancelLayoutTimer({});
    });

    _defineProperty(this, "updateLayout", function () {
      _this.hasToBeStarted();

      _this.onUpdateShownItemIndexes({
        reason: LAYOUT_REASON.MANUAL
      });
    });

    _defineProperty(this, "onRender", function () {
      _this._onRender(_this.getState(), _this.previousState);
    });

    VirtualScrollerConstructor.call(this, getItemsContainerElement, items, options);
  }
  /**
   * Should be invoked after a "container" DOM Element is mounted (inserted into the DOM tree).
   */


  _createClass(VirtualScroller, [{
    key: "start",
    value: function start() {
      if (this._isActive) {
        throw new Error('[virtual-scroller] `VirtualScroller` has already been started');
      } // If has been stopped previously.


      var isRestart = this._isActive === false;

      if (!isRestart) {
        this.waitingForRender = true; // If no custom state storage has been configured, use the default one.
        // Also sets the initial state.

        if (!this._usesCustomStateStorage) {
          this.useDefaultStateStorage();
        } // If `render()` function parameter was passed,
        // perform an initial render.


        if (this._render) {
          this._render(this.getState());
        }
      }

      if (isRestart) {
        log('~ Start (restart) ~');
      } else {
        log('~ Start ~');
      } // `this._isActive = true` should be placed somewhere at the start of this function.


      this._isActive = true; // Reset `ListHeightMeasurement` just in case it has some "leftover" state.

      this.listHeightMeasurement.reset(); // Reset `_isResizing` flag just in case it has some "leftover" value.

      this._isResizing = undefined; // Reset `_isSettingNewItems` flag just in case it has some "leftover" value.

      this._isSettingNewItems = undefined; // Work around `<tbody/>` not being able to have `padding`.
      // https://gitlab.com/catamphetamine/virtual-scroller/-/issues/1

      if (this.tbody) {
        if (!hasTbodyStyles(this.getItemsContainerElement())) {
          addTbodyStyles(this.getItemsContainerElement());
        }
      } // If there was a pending "after render" state update that didn't get applied
      // because the `VirtualScroller` got stopped, then apply that pending "after render"
      // state update now. Such state update could include properties like:
      // * A `verticalSpacing` that has been measured in `onRender()`.
      // * A cleaned-up `beforeResize` object that was cleaned-up in `onRender()`.


      var stateUpdate = this._afterRenderStateUpdateThatWasStopped;
      this._afterRenderStateUpdateThatWasStopped = undefined; // Reset `this.verticalSpacing` so that it re-measures it in cases when
      // the `VirtualScroller` was previously stopped and is now being restarted.
      // The rationale is that a previously captured inter-item vertical spacing
      // can't be "trusted" in a sense that the user might have resized the window
      // after the previous `state` has been snapshotted.
      // If the user has resized the window, then changing window width might have
      // activated different CSS `@media()` "queries" resulting in a potentially different
      // vertical spacing after the restart.
      // If it's not a restart then `this.verticalSpacing` is `undefined` anyway.

      this.verticalSpacing = undefined;
      var verticalSpacingStateUpdate = this.measureItemHeightsAndSpacing();

      if (verticalSpacingStateUpdate) {
        stateUpdate = _objectSpread(_objectSpread({}, stateUpdate), verticalSpacingStateUpdate);
      }

      this.scrollableContainerResizeHandler.start();
      this.scroll.start(); // If `scrollableContainerWidth` hasn't been measured yet,
      // measure it and write it to state.

      if (this.getState().scrollableContainerWidth === undefined) {
        var scrollableContainerWidth = this.scrollableContainer.getWidth();
        stateUpdate = _objectSpread(_objectSpread({}, stateUpdate), {}, {
          scrollableContainerWidth: scrollableContainerWidth
        });
      } else {
        // Reset layout:
        // * If the scrollable container width has changed while stopped.
        // * If the restored state was calculated for another scrollable container width.
        var newWidth = this.scrollableContainer.getWidth();
        var prevWidth = this.getState().scrollableContainerWidth;

        if (newWidth !== prevWidth) {
          log('~ Scrollable container width changed from', prevWidth, 'to', newWidth, '~'); // The pending state update (if present) won't be applied in this case.
          // That's ok because such state update could currently only originate in
          // `this.onContainerResize()` function. Therefore, alling `this.onContainerResize()` again
          // would rewrite all those `stateUpdate` properties anyway, so they're not passed.

          return this.onContainerResize();
        }
      } // If the `VirtualScroller` uses custom (external) state storage, then
      // check if the columns count has changed between calling `.getInitialState()`
      // and `.start()`. If it has, perform a re-layout "from scratch".


      if (this._usesCustomStateStorage) {
        var columnsCount = this.getActualColumnsCount();
        var columnsCountFromState = this.getState().columnsCount || 1;

        if (columnsCount !== columnsCountFromState) {
          return this.onContainerResize();
        }
      } // Re-calculate layout and re-render the list.
      // Do that even if when an initial `state` parameter, containing layout values,
      // has been passed. The reason is that the `state` parameter can't be "trusted"
      // in a way that it could have been snapshotted for another window width and
      // the user might have resized their window since then.


      this.onUpdateShownItemIndexes({
        reason: LAYOUT_REASON.STARTED,
        stateUpdate: stateUpdate
      });
    } // Could be passed as a "callback" parameter, so bind it to `this`.

  }, {
    key: "hasToBeStarted",
    value: function hasToBeStarted() {
      if (!this._isActive) {
        throw new Error('[virtual-scroller] `VirtualScroller` hasn\'t been started');
      }
    } // Bind it to `this` because this function could hypothetically be passed
    // as a "callback" parameter.

  }, {
    key: "getItemScrollPosition",
    value:
    /**
     * Returns the items's top offset relative to the scrollable container's top edge.
     * @param {number} i — Item index
     * @return {[number]} Returns the item's scroll Y position. Returns `undefined` if any of the previous items haven't been rendered yet.
     */
    function getItemScrollPosition(i) {
      var itemTopOffsetInList = this.layout.getItemTopOffset(i);

      if (itemTopOffsetInList === undefined) {
        return;
      }

      return this.getListTopOffsetInsideScrollableContainer() + itemTopOffsetInList;
    }
    /**
     * @deprecated
     * `.onItemHeightChange()` has been renamed to `.onItemHeightDidChange()`.
     */

  }, {
    key: "onItemHeightChange",
    value: function onItemHeightChange(i) {
      warn('`.onItemHeightChange(i)` method was renamed to `.onItemHeightDidChange(i)`');
      this.onItemHeightDidChange(i);
    }
    /**
     * Forces a re-measure of an item's height.
     * @param  {number} i — Item index
     */

  }, {
    key: "onItemHeightDidChange",
    value: function onItemHeightDidChange(i) {
      // See the comments in the `setItemState()` function below for the rationale
      // on why the `hasToBeStarted()` check was commented out.
      // this.hasToBeStarted()
      this._onItemHeightDidChange(i);
    }
    /**
     * Updates an item's state in `state.itemStates[]`.
     * @param  {number} i — Item index
     * @param  {any} i — Item's new state
     */

  }, {
    key: "setItemState",
    value: function setItemState(i, newItemState) {
      // There is an issue in React 18.2.0 when `useInsertionEffect()` doesn't run twice
      // on mount unlike `useLayoutEffect()` in "strict" mode. That causes a bug in a React
      // implementation of the `virtual-scroller`.
      // https://gitlab.com/catamphetamine/virtual-scroller/-/issues/33
      // https://github.com/facebook/react/issues/26320
      // A workaround for that bug is ignoring the second-initial run of the effects at mount.
      //
      // But in that case, if an `ItemComponent` calls `setItemState()` in `useLayoutEffect()`,
      // it could result in a bug.
      //
      // Consider a type of `useLayoutEffect()` that skips the initial mount:
      // `useLayoutEffectSkipInitialMount()`.
      // Suppose that effect is written in such a way that it only skips the first call of itself.
      // In that case, if React is run in "strict" mode, the effect will no longer work as expected
      // and it won't actually skip the initial mount and will be executed during the second initial run.
      // But the `VirtualScroller` itself has already implemented a workaround that prevents
      // its hooks from running twice on mount. This means that `useVirtualScrollerStartStop()`
      // of the React component would have already stopped the `VirtualScroller` by the time
      // `ItemComponent`'s incorrectly-behaving `useLayoutEffectSkipInitialMount()` effect is run,
      // resulting in an error: "`VirtualScroller` hasn't been started".
      //
      // The log when not in "strict" mode would be:
      //
      // * `useLayoutEffect()` is run in `ItemComponent` — skips the initial run.
      // * `useLayoutEffect()` is run in `useVirtualScrollerStartStop()`. It starts the `VirtualScroller`.
      // * Some dependency property gets updated inside `ItemComponent`.
      // * `useLayoutEffect()` is run in `ItemComponent` — no longer skips. Calls `setItemState()`.
      // * The `VirtualScroller` is started so it handles `setState()` correctly.
      //
      // The log when in "strict" mode would be:
      //
      // * `useLayoutEffect()` is run in `ItemComponent` — skips the initial run.
      // * `useLayoutEffect()` is run in `useVirtualScrollerStartStop()`. It starts the `VirtualScroller`.
      // * `useLayoutEffect()` is unmounted in `useVirtualScrollerStartStop()`. It stops the `VirtualScroller`.
      // * `useLayoutEffect()` is unmounted in `ItemComponent` — does nothing.
      // * `useLayoutEffect()` is run the second time in `ItemComponent` — no longer skips. Calls `setItemState()`.
      // * The `VirtualScroller` is stopped so it throws an error: "`VirtualScroller` hasn't been started".
      //
      // For that reason, the requirement of the `VirtualScroller` to be started was commented out.
      // Commenting it out wouldn't result in any potential bugs because the code would work correctly
      // in both cases.
      // this.hasToBeStarted()
      this._setItemState(i, newItemState);
    } // (deprecated)
    // Use `.setItemState()` method name instead.

  }, {
    key: "onItemStateChange",
    value: function onItemStateChange(i, newItemState) {
      this.setItemState(i, newItemState);
    }
    /**
     * Updates `items`. For example, can prepend or append new items to the list.
     * @param  {any[]} newItems
     * @param {boolean} [options.preserveScrollPositionOnPrependItems] — Set to `true` to enable "restore scroll position after prepending items" feature (could be useful when implementing "Show previous items" button).
     */

  }, {
    key: "setItems",
    value: function setItems(newItems) {
      var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
      this.hasToBeStarted();
      return this._setItems(newItems, options);
    }
  }]);

  return VirtualScroller;
}();

export { VirtualScroller as default };
//# sourceMappingURL=VirtualScroller.js.map