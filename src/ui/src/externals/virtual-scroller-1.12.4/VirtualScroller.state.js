function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { _defineProperty(target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

import fillArray from './utility/fillArray.js';
import log, { warn, isDebug, reportError } from './utility/debug.js';
import { cleanUpBeforeResizeState } from './BeforeResize.js';
import getStateSnapshot from './utility/getStateSnapshot.js'; // There're three main places where state is updated:
//
// * On scroll.
// * On window resize.
// * On set new items.
//
// State updates may be "asynchronous" (like in React), in which case the
// corresponding operation is "pending" until the state update is applied.
//
// If there's a "pending" window resize or a "pending" update of the set of items,
// then "on scroll" updates aren't dispatched.
//
// If there's a "pending" on scroll update and the window is resize or a new set
// of items is set, then that "pending" on scroll update gets overwritten.
//
// If there's a "pending" update of the set of items, then window resize handler
// sees that "pending" update and dispatches its own state update so that the
// "pending" state update originating from `setItems()` is not lost.
//
// If there's a "pending" window resize, and a new set of items is set,
// then the state update of the window resize handler gets overwritten.

export default function createStateHelpers(_ref) {
  var _this = this;

  var initialState = _ref.state,
      getInitialItemState = _ref.getInitialItemState,
      onStateChange = _ref.onStateChange,
      render = _ref.render,
      initialItems = _ref.items;
  this.onStateChange = onStateChange;
  this._render = render;
  this.getInitialItemState = getInitialItemState;

  this._setItemState = function (i, newItemState) {
    if (isDebug()) {
      log('~ Item state changed ~');
      log('Item index', i); // Uses `JSON.stringify()` here instead of just outputting the JSON objects as is
      // because outputting JSON objects as is would show different results later when
      // the developer inspects those in the web browser console if those state objects
      // get modified in between they've been output to the console and the developer
      // decided to inspect them.

      log('Previous state' + '\n' + JSON.stringify(_this.getState().itemStates[i], null, 2));
      log('New state' + '\n' + JSON.stringify(newItemState, null, 2));
    }

    _this.getState().itemStates[i] = newItemState; // If there was a request for `setState()` with new `items`, then the changes
    // to `currentState.itemStates[]` made above would be overwritten when that
    // pending `setState()` call gets applied.
    // To fix that, the updates to current `itemStates[]` are noted in
    // `this.itemStatesThatChangedWhileNewItemsWereBeingRendered` variable.
    // That variable is then checked when the `setState()` call with the new `items`
    // has been updated.

    if (_this.newItemsWillBeRendered) {
      if (!_this.itemStatesThatChangedWhileNewItemsWereBeingRendered) {
        _this.itemStatesThatChangedWhileNewItemsWereBeingRendered = {};
      }

      _this.itemStatesThatChangedWhileNewItemsWereBeingRendered[String(i)] = newItemState;
    }
  };

  this.getState = function () {
    return _this._getState();
  };

  this.updateState = function (stateUpdate) {
    if (isDebug()) {
      log('~ Set state ~');
      log(getStateSnapshot(stateUpdate));
    } // Ensure that a non-initial `stateUpdate` can only contain an `items`
    // property when it comes from a `setItems()` call.


    if (stateUpdate.items) {
      if (!_this._isSettingNewItems) {
        reportError('A `stateUpdate` can only contain `items` property as a result of calling `.setItems()`');
      }
    }

    _this._isSettingNewItems = undefined;
    _this.waitingForRender = true; // Store previous `state`.

    _this.previousState = _this.getState(); // If it's the first call to `this.updateState()` then initialize
    // the most recent `setState()` value to be the current state.

    if (!_this.mostRecentSetStateValue) {
      _this.mostRecentSetStateValue = _this.getState();
    } // Accumulates all "pending" state updates until they have been applied.


    _this.mostRecentSetStateValue = _objectSpread(_objectSpread({}, _this.mostRecentSetStateValue), stateUpdate); // Update `state`.

    _this._setState(_this.mostRecentSetStateValue, stateUpdate);
  };

  this.getInitialState = function () {
    if (initialState) {
      return getRestoredState.call(_this, initialState);
    }

    return getInitialStateFromScratch.call(_this, {
      getInitialItemState: getInitialItemState
    });
  };

  this.useState = function (_ref2) {
    var getState = _ref2.getState,
        setState = _ref2.setState,
        updateState = _ref2.updateState;

    if (_this._isActive) {
      throw new Error('[virtual-scroller] `VirtualScroller` has already been started');
    }

    if (_this._getState) {
      throw new Error('[virtual-scroller] Custom state storage has already been configured');
    }

    if (render) {
      throw new Error('[virtual-scroller] Creating a `VirtualScroller` class instance with a `render()` parameter implies using the default (internal) state storage');
    }

    if (setState && updateState) {
      throw new Error('[virtual-scroller] When using a custom state storage, one must supply either `setState()` or `updateState()` function but not both');
    }

    if (!getState || !(setState || updateState)) {
      throw new Error('[virtual-scroller] When using a custom state storage, one must supply both `getState()` and `setState()`/`updateState()` functions');
    }

    _this._usesCustomStateStorage = true;
    _this._getState = getState;

    _this._setState = function (newState, stateUpdate) {
      if (setState) {
        setState(newState);
      } else {
        updateState(stateUpdate);
      }
    };
  };

  this.useDefaultStateStorage = function () {
    if (!render) {
      throw new Error('[virtual-scroller] When using the default (internal) state management, one must supply a `render(state, prevState)` function parameter');
    } // Create default `getState()`/`setState()` functions.


    _this._getState = defaultGetState.bind(_this);
    _this._setState = defaultSetState.bind(_this); // When `state` is stored externally, a developer is responsible for
    // initializing it with the initial value.
    // Otherwise, if default state management is used, set the initial state now.

    var setInitialState = defaultSetInitialState.bind(_this);
    setInitialState(_this.getInitialState());
  };

  function defaultGetState() {
    return this.state;
  }

  function defaultSetInitialState(newState) {
    this.state = newState;
  }

  function defaultSetState(newState, stateUpdate) {
    // // Because the default state updates are "synchronous" (immediate),
    // // the `...stateUpdate` could be applied over `...this.state`,
    // // and no state updates would be lost.
    // // But if it was "asynchronous" (not immediate), then `...this.state`
    // // wouldn't work in all cases, because it could be stale in cases
    // // when more than a single `setState()` call is made before
    // // the state actually updates, making some properties of `this.state` stale.
    // this.state = {
    // 	...this.state,
    // 	...stateUpdate
    // }
    this.state = newState;
    render(this.state, this.previousState);
    this.onRender();
  }
  /**
   * Returns the initial state of the `VirtualScroller` "from scratch".
   * (i.e. not from a previously saved one).
   * @param {function} [options.getInitialItemState] — Gets initial item state.
   * @return {object}
   */


  function getInitialStateFromScratch(_ref3) {
    var getInitialItemState = _ref3.getInitialItemState;
    var items = initialItems;

    var state = _objectSpread(_objectSpread({}, getInitialLayoutState.call(this, items, {
      beforeStart: true
    })), {}, {
      items: items,
      itemStates: fillArray(new Array(items.length), function (i) {
        return getInitialItemState(items[i]);
      })
    });

    if (isDebug()) {
      log('Initial state (autogenerated)', getStateSnapshot(state));
    }

    log('First shown item index', state.firstShownItemIndex);
    log('Last shown item index', state.lastShownItemIndex);
    return state;
  }

  function getRestoredState(state) {
    if (isDebug()) {
      log('Restore state', getStateSnapshot(state));
    } // Possibly clean up "before resize" property in state.
    // "Before resize" state property is cleaned up when all "before resize" item heights
    // have been re-measured in an asynchronous `this.updateState({ beforeResize: undefined })` call.
    // If `VirtualScroller` state was snapshotted externally before that `this.updateState()` call
    // has been applied, then "before resize" property might have not been cleaned up properly.


    state = cleanUpBeforeResizeState(state); // Reset `verticalSpacing` so that it re-measures it after the list
    // has been rendered initially. The rationale is that a previously captured
    // inter-item vertical spacing can't be "trusted" in a sense that the user
    // might have resized the window after the previous `state` has been snapshotted.
    // If the user has resized the window, then changing window width might have
    // activated different CSS `@media()` "queries" resulting in a potentially different
    // vertical spacing when the `VirtualScroller` is re-created with such previously
    // snapshotted state.

    state = _objectSpread(_objectSpread({}, state), {}, {
      verticalSpacing: undefined
    }); // `this.verticalSpacing` acts as a "true" source for vertical spacing value.
    // Vertical spacing is also stored in `state` but `state` updates could be
    // "asynchronous" (not applied immediately) and `this.onUpdateShownItemIndexes()`
    // requires vertical spacing to be correct at any time, without any delays.
    // So, vertical spacing is also duplicated in `state`, but the "true" source
    // is still `this.verticalSpacing`.
    //
    // `this.verticalSpacing` must be initialized before calling `this.getInitialStateFromScratch()`
    // because `this.getInitialStateFromScratch()` uses `this.verticalSpacing` in its calculations.
    //
    // With the code above, `state.verticalSpacing` is always gonna be `undefined`,
    // so commented out this code. It's safer to just re-measure vertical spacing
    // from scratch when `VirtualScroller` is mounted.
    //
    // this.verticalSpacing = state ? state.verticalSpacing : undefined
    // Check if the actual `columnsCount` on the screen matches the one from state.

    if (isStateColumnsCountMismatch(state, {
      columnsCount: this.getActualColumnsCount()
    })) {
      warn('Reset Layout');
      state = _objectSpread(_objectSpread({}, state), getInitialLayoutState.call(this, state.items, {
        beforeStart: false
      }));
    }

    return state;
  }

  function getInitialLayoutState(items, _ref4) {
    var _this2 = this;

    var beforeStart = _ref4.beforeStart;
    var itemsCount = items.length;

    var getColumnsCount = function getColumnsCount() {
      return _this2.getActualColumnsCount();
    };

    var columnsCount = beforeStart ? this.layout.getInitialLayoutValueWithFallback('columnsCount', getColumnsCount, 1) : getColumnsCount();

    var _this$layout$getIniti = this.layout.getInitialLayoutValues({
      itemsCount: itemsCount,
      columnsCount: this.getActualColumnsCount(),
      beforeStart: beforeStart
    }),
        firstShownItemIndex = _this$layout$getIniti.firstShownItemIndex,
        lastShownItemIndex = _this$layout$getIniti.lastShownItemIndex,
        beforeItemsHeight = _this$layout$getIniti.beforeItemsHeight,
        afterItemsHeight = _this$layout$getIniti.afterItemsHeight;

    var itemHeights = new Array(itemsCount); // Optionally preload items to be rendered.

    this.onBeforeShowItems(items, itemHeights, firstShownItemIndex, lastShownItemIndex);
    return {
      itemHeights: itemHeights,
      columnsCount: this.getActualColumnsCountForState(),
      verticalSpacing: this.verticalSpacing,
      firstShownItemIndex: firstShownItemIndex,
      lastShownItemIndex: lastShownItemIndex,
      beforeItemsHeight: beforeItemsHeight,
      afterItemsHeight: afterItemsHeight
    };
  } // Checks if the actual `columnsCount` on the screen matches the one from state.
  //
  // For example, a developer might snapshot `VirtualScroller` state
  // when the user navigates from the page containing the list
  // in order to later restore the list's state when the user goes "Back".
  // But, the user might have also resized the window while being on that
  // "other" page, and when they come "Back", their snapshotted state
  // no longer qualifies. Well, it does qualify, but only partially.
  // For example, `itemStates` are still valid, but first and last shown
  // item indexes aren't.
  //


  function isStateColumnsCountMismatch(state, _ref5) {
    var columnsCount = _ref5.columnsCount;
    var stateColumnsCount = state.columnsCount || 1;

    if (stateColumnsCount !== columnsCount) {
      warn('~ Columns Count changed from', stateColumnsCount, 'to', columnsCount, '~');
      return true;
    }

    var firstShownItemIndex = Math.floor(state.firstShownItemIndex / columnsCount) * columnsCount;

    if (firstShownItemIndex !== state.firstShownItemIndex) {
      warn('~ First Shown Item Index', state.firstShownItemIndex, 'is not divisible by Columns Count', columnsCount, '~');
      return true;
    }
  }
}
//# sourceMappingURL=VirtualScroller.state.js.map