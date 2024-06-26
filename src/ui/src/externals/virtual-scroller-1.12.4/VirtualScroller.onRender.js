function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { _defineProperty(target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

import log, { warn, reportError, isDebug } from './utility/debug.js';
import getStateSnapshot from './utility/getStateSnapshot.js';
import shallowEqual from './utility/shallowEqual.js';
import { LAYOUT_REASON } from './Layout.js';
import { setTbodyPadding } from './DOM/tbody.js';
export default function () {
  var _this = this;

  /**
   * Should be called right after updates to `state` have been rendered.
   * @param  {object} newState
   * @param  {object} [prevState]
   */
  this._onRender = function (newState, prevState) {
    _this.waitingForRender = false;
    log('~ Rendered ~');

    if (isDebug()) {
      log('State', getStateSnapshot(newState));
    }

    if (_this.onStateChange) {
      if (!shallowEqual(newState, prevState)) {
        _this.onStateChange(newState);
      }
    } // Update `<tbody/>` `padding`.
    // (`<tbody/>` is different in a way that it can't have `margin`, only `padding`).
    // https://gitlab.com/catamphetamine/virtual-scroller/-/issues/1


    if (_this.tbody) {
      setTbodyPadding(_this.getItemsContainerElement(), newState.beforeItemsHeight, newState.afterItemsHeight);
    } // `this.mostRecentlySetState` checks that state management behavior is correct:
    // that in situations when there're multiple new states waiting to be set,
    // only the latest one gets applied.
    // It keeps the code simpler and prevents possible race condition bugs.
    // For example, `VirtualScroller` keeps track of its latest requested
    // state update in different instance variable flags which assume that
    // only that latest requested state update gets actually applied.
    //
    // This check should also be performed for the initial render in order to
    // guarantee that no potentially incorrect state update goes unnoticed.
    // Incorrect state updates could happen when `VirtualScroller` state
    // is managed externally by passing `getState()`/`updateState()` options.
    //
    // Perform the check only when `this.mostRecentSetStateValue` is defined.
    // `this.mostRecentSetStateValue` is normally gonna be `undefined` at the initial render
    // because the initial state is not set by calling `this.updateState()`.
    // At the same time, it is possible that the initial render is delayed
    // for whatever reason, and `this.updateState()` gets called before the initial render,
    // so `this.mostRecentSetStateValue` could also be defined at the initial render,
    // in which case the check should be performed.
    //


    if (_this.mostRecentSetStateValue) {
      // "Shallow equality" is used here instead of "strict equality"
      // because a developer might choose to supply an `updateState()` function
      // rather than a `setState()` function, in which case the `updateState()` function
      // would construct its own state object.
      if (!shallowEqual(newState, _this.mostRecentSetStateValue)) {
        warn('The most recent state that was set', getStateSnapshot(_this.mostRecentSetStateValue));
        reportError('`VirtualScroller` has been rendered with a `state` that is not equal to the most recently set one');
      }
    } // `this.resetStateUpdateFlags()` must be called before calling
    // `this.measureItemHeightsAndSpacing()`.


    var _resetStateUpdateFlag = resetStateUpdateFlags.call(_this),
        nonMeasuredItemsHaveBeenRendered = _resetStateUpdateFlag.nonMeasuredItemsHaveBeenRendered,
        itemHeightHasChanged = _resetStateUpdateFlag.itemHeightHasChanged,
        widthHasChanged = _resetStateUpdateFlag.widthHasChanged;

    var layoutUpdateReason;

    if (itemHeightHasChanged) {
      layoutUpdateReason = LAYOUT_REASON.ITEM_HEIGHT_CHANGED;
    }

    if (!prevState) {
      if (!layoutUpdateReason) {
        return;
      }
    } // If the `VirtualScroller`, while calculating layout parameters, encounters
    // a not-shown item with a non-measured height, it calls `updateState()` just to
    // render that item first, and then, after the list has been re-rendered, it measures
    // the item's height and then proceeds with calculating the correct layout parameters.


    if (nonMeasuredItemsHaveBeenRendered) {
      layoutUpdateReason = LAYOUT_REASON.NON_MEASURED_ITEMS_HAVE_BEEN_MEASURED;
    } // If scrollable container width has changed, and it has been re-rendered,
    // then it's time to measure the new item heights and then perform a re-layout
    // with the correctly calculated layout parameters.
    //
    // A re-layout is required because the layout parameters calculated on resize
    // are approximate ones, and the exact item heights aren't known at that point.
    // So on resize, it calls `updateState()` just to re-render the `VirtualScroller`.
    // After it has been re-rendered, it will measure item heights and then calculate
    // correct layout parameters.
    //


    if (widthHasChanged) {
      layoutUpdateReason = LAYOUT_REASON.VIEWPORT_WIDTH_CHANGED; // Reset measured item heights on viewport width change.

      _this.itemHeights.reset(); // Reset `verticalSpacing` (will be re-measured).


      _this.verticalSpacing = undefined;
    }

    if (prevState) {
      var previousItems = prevState.items;
      var newItems = newState.items; // Even if `this.newItemsWillBeRendered` flag is `true`,
      // `newItems` could still be equal to `previousItems`.
      // For example, when `updateState()` calls don't update `state` immediately
      // and a developer first calls `setItems(newItems)` and then calls `setItems(oldItems)`:
      // in that case, `this.newItemsWillBeRendered` flag will be `true` but the actual `items`
      // in state wouldn't have changed due to the first `updateState()` call being overwritten
      // by the second `updateState()` call (that's called "batching state updates" in React).

      if (newItems !== previousItems) {
        var itemsDiff = _this.getItemsDiff(previousItems, newItems);

        if (itemsDiff) {
          // The call to `.onPrepend()` must precede the call to `.measureItemHeights()`
          // which is called in `.onRender()`.
          // `this.itemHeights.onPrepend()` updates `firstMeasuredItemIndex`
          // and `lastMeasuredItemIndex` of `this.itemHeights`.
          var prependedItemsCount = itemsDiff.prependedItemsCount;

          _this.itemHeights.onPrepend(prependedItemsCount);
        } else {
          _this.itemHeights.reset();
        }

        if (!widthHasChanged) {
          // The call to `this.onNewItemsRendered()` must precede the call to
          // `.measureItemHeights()` which is called in `.onRender()` because
          // `this.onNewItemsRendered()` updates `firstMeasuredItemIndex` and
          // `lastMeasuredItemIndex` of `this.itemHeights` in case of a prepend.
          //
          // If after prepending items the scroll position
          // should be "restored" so that there's no "jump" of content
          // then it means that all previous items have just been rendered
          // in a single pass, and there's no need to update layout again.
          //
          if (onNewItemsRendered.call(_this, itemsDiff, newState) !== 'SEAMLESS_PREPEND') {
            layoutUpdateReason = LAYOUT_REASON.ITEMS_CHANGED;
          }
        }
      }
    }

    var stateUpdate; // Re-measure item heights.
    // Also, measure vertical spacing (if not measured) and fix `<table/>` padding.
    //
    // This block should go after `if (newItems !== previousItems) {}`
    // because `this.itemHeights` can get `.reset()` there, which would
    // discard all the measurements done here, and having currently shown
    // item height measurements is required.
    //

    if (prevState && (newState.firstShownItemIndex !== prevState.firstShownItemIndex || newState.lastShownItemIndex !== prevState.lastShownItemIndex || newState.items !== prevState.items) || widthHasChanged) {
      var verticalSpacingStateUpdate = _this.measureItemHeightsAndSpacing();

      if (verticalSpacingStateUpdate) {
        stateUpdate = _objectSpread(_objectSpread({}, stateUpdate), verticalSpacingStateUpdate);
      }
    } // Clean up "before resize" item heights and adjust the scroll position accordingly.
    // Calling `this.beforeResize.cleanUpBeforeResizeItemHeights()` might trigger
    // a `this.updateState()` call but that wouldn't matter because `beforeResize`
    // properties have already been modified directly in `state` (a hacky technique)


    var cleanedUpBeforeResize = _this.beforeResize.cleanUpBeforeResizeItemHeights();

    if (cleanedUpBeforeResize !== undefined) {
      var scrollBy = cleanedUpBeforeResize.scrollBy,
          beforeResize = cleanedUpBeforeResize.beforeResize;
      log('Correct scroll position by', scrollBy);

      _this.scroll.scrollByY(scrollBy);

      stateUpdate = _objectSpread(_objectSpread({}, stateUpdate), {}, {
        beforeResize: beforeResize
      });
    }

    if (!_this._isActive) {
      _this._afterRenderStateUpdateThatWasStopped = stateUpdate;
      return;
    }

    if (layoutUpdateReason) {
      updateStateRightAfterRender.call(_this, {
        stateUpdate: stateUpdate,
        reason: layoutUpdateReason
      });
    } else if (stateUpdate) {
      _this.updateState(stateUpdate);
    } else {
      log('~ Finished Layout ~');
    }
  }; // After a new set of items has been rendered:
  //
  // * Restores scroll position when using `preserveScrollPositionOnPrependItems`
  //   and items have been prepended.
  //
  // * Applies any "pending" `itemHeights` updates — those ones that happened
  //   while an asynchronous `updateState()` call in `setItems()` was pending.
  //
  // * Either creates or resets the snapshot of the current layout.
  //
  //   The current layout snapshot could be stored as a "previously calculated layout" variable
  //   so that it could theoretically be used when calculating new layout incrementally
  //   rather than from scratch, which would be an optimization.
  //
  //   The "previously calculated layout" feature is not currently used.
  //


  function onNewItemsRendered(itemsDiff, newLayout) {
    // If it's an "incremental" update.
    if (itemsDiff) {
      var prependedItemsCount = itemsDiff.prependedItemsCount,
          appendedItemsCount = itemsDiff.appendedItemsCount;

      var _this$getState = this.getState(),
          itemHeights = _this$getState.itemHeights,
          itemStates = _this$getState.itemStates; // See if any items' heights changed while new items were being rendered.


      if (this.itemHeightsThatChangedWhileNewItemsWereBeingRendered) {
        for (var _i = 0, _Object$keys = Object.keys(this.itemHeightsThatChangedWhileNewItemsWereBeingRendered); _i < _Object$keys.length; _i++) {
          var i = _Object$keys[_i];
          itemHeights[prependedItemsCount + Number(i)] = this.itemHeightsThatChangedWhileNewItemsWereBeingRendered[i];
        }
      } // See if any items' states changed while new items were being rendered.


      if (this.itemStatesThatChangedWhileNewItemsWereBeingRendered) {
        for (var _i2 = 0, _Object$keys2 = Object.keys(this.itemStatesThatChangedWhileNewItemsWereBeingRendered); _i2 < _Object$keys2.length; _i2++) {
          var _i3 = _Object$keys2[_i2];
          itemStates[prependedItemsCount + Number(_i3)] = this.itemStatesThatChangedWhileNewItemsWereBeingRendered[_i3];
        }
      }

      if (prependedItemsCount === 0) {
        // Adjust `this.previouslyCalculatedLayout`.
        if (this.previouslyCalculatedLayout) {
          if (this.previouslyCalculatedLayout.firstShownItemIndex === newLayout.firstShownItemIndex && this.previouslyCalculatedLayout.lastShownItemIndex === newLayout.lastShownItemIndex) {// `this.previouslyCalculatedLayout` stays the same.
            // `firstShownItemIndex` / `lastShownItemIndex` didn't get changed in `setItems()`,
            // so `beforeItemsHeight` and `shownItemsHeight` also stayed the same.
          } else {
            warn('Unexpected (non-matching) "firstShownItemIndex" or "lastShownItemIndex" encountered in "onRender()" after appending items');
            warn('Previously calculated layout', this.previouslyCalculatedLayout);
            warn('New layout', newLayout);
            this.previouslyCalculatedLayout = undefined;
          }
        }

        return 'SEAMLESS_APPEND';
      } else {
        if (this.listHeightMeasurement.hasSnapshot()) {
          if (newLayout.firstShownItemIndex === 0) {
            // Restore (adjust) scroll position.
            log('~ Restore Scroll Position ~');
            var listBottomOffsetChange = this.listHeightMeasurement.getListBottomOffsetChange({
              beforeItemsHeight: newLayout.beforeItemsHeight
            });
            this.listHeightMeasurement.reset();

            if (listBottomOffsetChange) {
              log('Scroll down by', listBottomOffsetChange);
              this.scroll.scrollByY(listBottomOffsetChange);
            } else {
              log('Scroll position hasn\'t changed');
            } // Create new `this.previouslyCalculatedLayout`.


            if (this.previouslyCalculatedLayout) {
              if (this.previouslyCalculatedLayout.firstShownItemIndex === 0 && this.previouslyCalculatedLayout.lastShownItemIndex === newLayout.lastShownItemIndex - prependedItemsCount) {
                this.previouslyCalculatedLayout = {
                  beforeItemsHeight: 0,
                  shownItemsHeight: this.previouslyCalculatedLayout.shownItemsHeight + listBottomOffsetChange,
                  firstShownItemIndex: 0,
                  lastShownItemIndex: newLayout.lastShownItemIndex
                };
              } else {
                warn('Unexpected (non-matching) "firstShownItemIndex" or "lastShownItemIndex" encountered in "onRender()" after prepending items');
                warn('Previously calculated layout', this.previouslyCalculatedLayout);
                warn('New layout', newLayout);
                this.previouslyCalculatedLayout = undefined;
              }
            }

            return 'SEAMLESS_PREPEND';
          } else {
            warn("Unexpected \"firstShownItemIndex\" ".concat(newLayout.firstShownItemIndex, " encountered in \"onRender()\" after prepending items. Expected 0."));
          }
        }
      }
    } // Reset `this.previouslyCalculatedLayout` in any case other than
    // SEAMLESS_PREPEND or SEAMLESS_APPEND.


    this.previouslyCalculatedLayout = undefined;
  }

  function updateStateRightAfterRender(_ref) {
    var reason = _ref.reason,
        stateUpdate = _ref.stateUpdate;

    // In React, `setTimeout()` is used to prevent a React error:
    // "Maximum update depth exceeded.
    //  This can happen when a component repeatedly calls
    //  `.updateState()` inside `componentWillUpdate()` or `componentDidUpdate()`.
    //  React limits the number of nested updates to prevent infinite loops."
    if (this._useTimeoutInRenderLoop) {
      // Cancel a previously scheduled re-layout.
      stateUpdate = this.cancelLayoutTimer({
        stateUpdate: stateUpdate
      }); // Schedule a new re-layout.

      this.scheduleLayoutTimer({
        reason: reason,
        stateUpdate: stateUpdate
      });
    } else {
      this.onUpdateShownItemIndexes({
        reason: reason,
        stateUpdate: stateUpdate
      });
    }
  }

  function resetStateUpdateFlags() {
    // Read and reset `this.widthHasChanged` flag.
    //
    // If `this.widthHasChanged` flag was reset after calling
    // `this.measureWidthHeightsAndSpacingAndUpdateTablePadding()`
    // then there would be a bug because
    // `this.measureWidthHeightsAndSpacingAndUpdateTablePadding()`
    // calls `this.updateState({ verticalSpacing })` which calls
    // `this.onRender()` immediately, so `this.widthHasChanged`
    // flag wouldn't be reset by that time and would trigger things
    // like `this.itemHeights.reset()` a second time.
    //
    // So, instead read the value of `this.widthHasChanged` flag
    // and reset it right away to prevent any such potential bugs.
    //
    var widthHasChanged = Boolean(this.widthHasChanged); //
    // Reset `this.widthHasChanged` flag.

    this.widthHasChanged = undefined; // Read `this.firstNonMeasuredItemIndex` flag.

    var nonMeasuredItemsHaveBeenRendered = this.firstNonMeasuredItemIndex !== undefined;

    if (nonMeasuredItemsHaveBeenRendered) {
      log('Non-measured item index', this.firstNonMeasuredItemIndex);
    } // Reset `this.firstNonMeasuredItemIndex` flag.


    this.firstNonMeasuredItemIndex = undefined; // Reset `this.newItemsWillBeRendered` flag.

    this.newItemsWillBeRendered = undefined; // Reset `this.itemHeightsThatChangedWhileNewItemsWereBeingRendered`.

    this.itemHeightsThatChangedWhileNewItemsWereBeingRendered = undefined; // Reset `this.itemStatesThatChangedWhileNewItemsWereBeingRendered`.

    this.itemStatesThatChangedWhileNewItemsWereBeingRendered = undefined; // Reset `this.updateLayoutAfterRenderBecauseItemHeightChanged`.

    var itemHeightHasChanged = this.updateLayoutAfterRenderBecauseItemHeightChanged;
    this.updateLayoutAfterRenderBecauseItemHeightChanged = undefined;
    return {
      nonMeasuredItemsHaveBeenRendered: nonMeasuredItemsHaveBeenRendered,
      itemHeightHasChanged: itemHeightHasChanged,
      widthHasChanged: widthHasChanged
    };
  }
}
//# sourceMappingURL=VirtualScroller.onRender.js.map