function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); Object.defineProperty(Constructor, "prototype", { writable: false }); return Constructor; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

import debounce from './utility/debounce.js';
import log from './utility/debug.js';

var ScrollableContainerResizeHandler = /*#__PURE__*/function () {
  function ScrollableContainerResizeHandler(_ref) {
    var _this = this;

    var bypass = _ref.bypass,
        getWidth = _ref.getWidth,
        getHeight = _ref.getHeight,
        listenForResize = _ref.listenForResize,
        onResizeStart = _ref.onResizeStart,
        onResizeStop = _ref.onResizeStop,
        onHeightChange = _ref.onHeightChange,
        onWidthChange = _ref.onWidthChange,
        onNoChange = _ref.onNoChange;

    _classCallCheck(this, ScrollableContainerResizeHandler);

    _defineProperty(this, "_onResize", function () {
      // If `VirtualScroller` has been unmounted
      // while `debounce()`'s `setTimeout()` was waiting, then exit.
      // If the `VirtualScroller` gets restarted later, it will detect
      // that `state.scrollableContainerWidth` doesn't match the actual
      // scrollable container width, and will call `this.onResize()`.
      if (!_this.isActive) {
        return;
      }

      var prevScrollableContainerWidth = _this.width;
      var prevScrollableContainerHeight = _this.height;
      _this.width = _this.getWidth();
      _this.height = _this.getHeight();

      if (_this.width === prevScrollableContainerWidth) {
        if (_this.height === prevScrollableContainerHeight) {
          // The dimensions of the container didn't change,
          // so there's no need to re-layout anything.
          _this.onNoChange();
        } else {
          // Scrollable container height has changed,
          // so just recalculate shown item indexes.
          // No need to perform a re-layout from scratch.
          _this.onHeightChange(prevScrollableContainerHeight, _this.height);
        }
      } else {
        // Reset item heights, because if scrollable container's width (or height)
        // has changed, then the list width (or height) most likely also has changed,
        // and also some CSS `@media()` rules might have been added or removed.
        // So re-render the list entirely.
        _this.onWidthChange(prevScrollableContainerWidth, _this.width);
      }
    });

    this.bypass = bypass;
    this.onHeightChange = onHeightChange;
    this.onWidthChange = onWidthChange;
    this.onNoChange = onNoChange;
    this.getWidth = getWidth;
    this.getHeight = getHeight;
    this.listenForResize = listenForResize;
    this.onResize = debounce(this._onResize, SCROLLABLE_CONTAINER_RESIZE_DEBOUNCE_INTERVAL, {
      onStart: onResizeStart,
      onStop: onResizeStop
    });
  }

  _createClass(ScrollableContainerResizeHandler, [{
    key: "start",
    value: function start() {
      this.isActive = true;

      if (this.bypass) {
        return;
      }

      this.width = this.getWidth();
      this.height = this.getHeight();
      this.unlistenResize = this.listenForResize(this.onResize);
    }
  }, {
    key: "stop",
    value: function stop() {
      this.isActive = false;
      this.width = undefined;
      this.height = undefined;

      if (this.unlistenResize) {
        this.unlistenResize();
        this.unlistenResize = undefined;
      }
    }
    /**
     * On scrollable container resize.
     */

  }]);

  return ScrollableContainerResizeHandler;
}();

export { ScrollableContainerResizeHandler as default };
var SCROLLABLE_CONTAINER_RESIZE_DEBOUNCE_INTERVAL = 250;
//# sourceMappingURL=ScrollableContainerResizeHandler.js.map