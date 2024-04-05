import log from './utility/debug.js';
import getVerticalSpacing from './getVerticalSpacing.js';
export default function createVerticalSpacingHelpers() {
  var _this = this;

  // Bind to `this` in order to prevent bugs when this function is passed by reference
  // and then called with its `this` being unintentionally `window` resulting in
  // the `if` condition being "falsy".
  this.getVerticalSpacing = function () {
    return _this.verticalSpacing || 0;
  };

  this.getVerticalSpacingBeforeResize = function () {
    // `beforeResize.verticalSpacing` can be `undefined`.
    // For example, if `this.updateState({ verticalSpacing })` call hasn't been applied
    // before the resize happened (in case of an "asynchronous" state update).
    var _this$getState = _this.getState(),
        beforeResize = _this$getState.beforeResize;

    return beforeResize && beforeResize.verticalSpacing || 0;
  };
  /**
   * Measures item vertical spacing, if not measured.
   * @return {object} [stateUpdate]
   */


  this.measureVerticalSpacingIfNotMeasured = function () {
    if (_this.verticalSpacing === undefined) {
      _this.verticalSpacing = measureVerticalSpacing.call(_this);
      return _this.verticalSpacing;
    }
  };

  function measureVerticalSpacing() {
    var _this$getState2 = this.getState(),
        firstShownItemIndex = _this$getState2.firstShownItemIndex,
        lastShownItemIndex = _this$getState2.lastShownItemIndex;

    log('~ Measure item vertical spacing ~');
    var verticalSpacing = getVerticalSpacing({
      itemsContainer: this.itemsContainer,
      renderedItemsCount: lastShownItemIndex - firstShownItemIndex + 1
    });

    if (verticalSpacing === undefined) {
      log('Not enough items rendered to measure vertical spacing');
    } else {
      log('Item vertical spacing', verticalSpacing);
      return verticalSpacing;
    }
  }
}
//# sourceMappingURL=VirtualScroller.verticalSpacing.js.map