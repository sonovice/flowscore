function _typeof(obj) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) { return typeof obj; } : function (obj) { return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }, _typeof(obj); }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); Object.defineProperty(subClass, "prototype", { writable: false }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = _getPrototypeOf(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = _getPrototypeOf(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return _possibleConstructorReturn(this, result); }; }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } else if (call !== void 0) { throw new TypeError("Derived constructors may only return object or undefined"); } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); Object.defineProperty(Constructor, "prototype", { writable: false }); return Constructor; }

import ScrollableContainerNotReadyError from '../ScrollableContainerNotReadyError.js';

var ScrollableContainer = /*#__PURE__*/function () {
  /**
   * Constructs a new "scrollable container" from an element.
   * @param {func} getElement — Returns the scrollable container element.
   * @param {func} getItemsContainerElement — Returns items "container" element.
   */
  function ScrollableContainer(getElement, getItemsContainerElement) {
    _classCallCheck(this, ScrollableContainer);

    this.getElement = getElement;
    this.getItemsContainerElement = getItemsContainerElement;
  }
  /**
   * Returns the current scroll position.
   * @return {number}
   */


  _createClass(ScrollableContainer, [{
    key: "getScrollY",
    value: function getScrollY() {
      return this.getElement().scrollTop;
    }
    /**
     * Scrolls to a specific position.
     * @param {number} scrollY
     */

  }, {
    key: "scrollToY",
    value: function scrollToY(scrollY) {
      // IE 11 doesn't seem to have a `.scrollTo()` method.
      // https://gitlab.com/catamphetamine/virtual-scroller/-/issues/10
      // https://stackoverflow.com/questions/39908825/window-scrollto-is-not-working-in-internet-explorer-11
      if (this.getElement().scrollTo) {
        this.getElement().scrollTo(0, scrollY);
      } else {
        this.getElement().scrollTop = scrollY;
      }
    }
    /**
     * Returns "scrollable container" width,
     * i.e. the available width for its content.
     * @return {number}
     */

  }, {
    key: "getWidth",
    value: function getWidth() {
      if (!this.getElement()) {
        throw new ScrollableContainerNotReadyError();
      }

      return this.getElement().offsetWidth;
    }
    /**
     * Returns the height of the "scrollable container" itself.
     * Not to be confused with the height of "scrollable container"'s content.
     * @return {number}
     */

  }, {
    key: "getHeight",
    value: function getHeight() {
      if (!this.getElement()) {
        throw new ScrollableContainerNotReadyError();
      } // if (!this.getElement() && !precise) {
      // 	return getScreenHeight()
      // }


      return this.getElement().offsetHeight;
    }
    /**
     * Returns a "top offset" of an items container element
     * relative to the "scrollable container"'s top edge.
     * @return {number}
     */

  }, {
    key: "getItemsContainerTopOffset",
    value: function getItemsContainerTopOffset() {
      var scrollableContainerTop = this.getElement().getBoundingClientRect().top;
      var scrollableContainerBorderTopWidth = this.getElement().clientTop;
      var itemsContainerTop = this.getItemsContainerElement().getBoundingClientRect().top;
      return itemsContainerTop - scrollableContainerTop + this.getScrollY() - scrollableContainerBorderTopWidth;
    } // isVisible() {
    // 	const { top, bottom } = this.getElement().getBoundingClientRect()
    // 	return bottom > 0 && top < getScreenHeight()
    // }

    /**
     * Adds a "scroll" event listener to the "scrollable container".
     * @param {onScrollListener} Should be called whenever the scroll position inside the "scrollable container" (potentially) changes.
     * @return {function} Returns a function that stops listening.
     */

  }, {
    key: "onScroll",
    value: function onScroll(onScrollListener) {
      var element = this.getElement();
      element.addEventListener('scroll', onScrollListener);
      return function () {
        return element.removeEventListener('scroll', onScrollListener);
      };
    }
    /**
     * Adds a "resize" event listener to the "scrollable container".
     * @param {onResize} Should be called whenever the "scrollable container"'s width or height (potentially) changes.
      * @return {function} Returns a function that stops listening.
     */

  }, {
    key: "onResize",
    value: function onResize(_onResize) {
      // Watches "scrollable container"'s dimensions via a `ResizeObserver`.
      // https://developer.mozilla.org/en-US/docs/Web/API/ResizeObserver
      // https://web.dev/resize-observer/
      var unobserve;

      if (typeof ResizeObserver !== 'undefined') {
        var resizeObserver = new ResizeObserver(function (entries) {
          // "one entry per observed element".
          // https://web.dev/resize-observer/
          // `entry.target === this.getElement()`.
          var entry = entries[0]; // // If `entry.contentBoxSize` property is supported by the web browser.
          // if (entry.contentBoxSize) {
          // 	// https://developer.mozilla.org/en-US/docs/Web/API/ResizeObserverEntry/contentBoxSize
          // 	const width = entry.contentBoxSize.inlineSize
          // 	const height = entry.contentBoxSize.blockSize
          // }

          _onResize();
        });
        var element = this.getElement();
        resizeObserver.observe(element);

        unobserve = function unobserve() {
          return resizeObserver.unobserve(element);
        };
      } // I guess, if window is resized, `onResize()` will be triggered twice:
      // once for window resize, and once for the scrollable container resize.
      // But `onResize()` also has an internal check: if the container size
      // hasn't changed since the previous time `onResize()` has been called,
      // then `onResize()` doesn't do anything, so, I guess, there shouldn't be
      // any "performance implications" of running the listener twice in such case.


      var unlistenGlobalResize = addGlobalResizeListener(_onResize, {
        itemsContainerElement: this.getItemsContainerElement()
      });
      return function () {
        if (unobserve) {
          unobserve();
        }

        unlistenGlobalResize();
      };
    }
  }]);

  return ScrollableContainer;
}();

export { ScrollableContainer as default };
export var ScrollableWindowContainer = /*#__PURE__*/function (_ScrollableContainer) {
  _inherits(ScrollableWindowContainer, _ScrollableContainer);

  var _super = _createSuper(ScrollableWindowContainer);

  /**
   * Constructs a new window "scrollable container".
   * @param {func} getItemsContainerElement — Returns items "container" element.
   */
  function ScrollableWindowContainer(getItemsContainerElement) {
    _classCallCheck(this, ScrollableWindowContainer);

    return _super.call(this, function () {
      return window;
    }, getItemsContainerElement);
  }
  /**
   * Returns the current scroll position.
   * @return {number}
   */


  _createClass(ScrollableWindowContainer, [{
    key: "getScrollY",
    value: function getScrollY() {
      // `window.scrollY` is not supported by Internet Explorer.
      return window.pageYOffset;
    }
    /**
     * Returns "scrollable container" width,
     * i.e. the available width for its content.
     * @return {number}
     */

  }, {
    key: "getWidth",
    value: function getWidth() {
      // https://javascript.info/size-and-scroll-window
      // `<!DOCTYPE html>` may be required in order for this to work correctly.
      // Includes scrollbar (if any).
      // Correctly reflects page zoom in iOS Safari.
      // (scales screen width accordingly).
      // But, includes scrollbar (if any).
      return window.innerWidth;
    }
    /**
     * Returns the height of the "scrollable container" itself.
     * Not to be confused with the height of "scrollable container"'s content.
     * @return {number}
     */

  }, {
    key: "getHeight",
    value: function getHeight() {
      // https://javascript.info/size-and-scroll-window
      // `<!DOCTYPE html>` is required in order for this to work correctly.
      // Without it, the returned height would be the height of the entire document.
      // Includes scrollbar (if any).
      // Supports iOS Safari's dynamically shown/hidden
      // top URL bar and bottom actions bar.
      // https://codesandbox.io/s/elegant-fog-iddrh
      // Tested in IE 11.
      // It also correctly reflects page zoom in iOS Safari.
      // (scales screen height accordingly).
      // But, includes scrollbar (if any).
      return window.innerHeight;
    }
    /**
     * Returns a "top offset" of an items container element
     * relative to the "scrollable container"'s top edge.
     * @return {number}
     */

  }, {
    key: "getItemsContainerTopOffset",
    value: function getItemsContainerTopOffset() {
      var borderTopWidth = document.clientTop || document.body.clientTop || 0;
      return this.getItemsContainerElement().getBoundingClientRect().top + this.getScrollY() - borderTopWidth;
    }
    /**
     * Adds a "resize" event listener to the "scrollable container".
     * @param {onScroll} Should be called whenever the "scrollable container"'s width or height (potentially) changes.
     * @return {function} Returns a function that stops listening.
     */

  }, {
    key: "onResize",
    value: function onResize(_onResize2) {
      return addGlobalResizeListener(_onResize2, {
        itemsContainerElement: this.getItemsContainerElement()
      });
    } // isVisible() {
    // 	return true
    // }

  }]);

  return ScrollableWindowContainer;
}(ScrollableContainer);
/**
 * Adds a "resize" event listener to the `window`.
 * @param {onResize} Should be called whenever the "scrollable container"'s width or height (potentially) changes.
 * @param  {Element} options.itemsContainerElement — The items "container" element, which is not the same as the "scrollable container" element. For example, "scrollable container" could be resized while the list element retaining its size. One such example is a user entering fullscreen mode on an HTML5 `<video/>` element: in that case, a "resize" event is triggered on a window, and window dimensions change to the user's screen size, but such "resize" event can be ignored because the list isn't visible until the user exits fullscreen mode.
 * @return {function} Returns a function that stops listening.
 */

function addGlobalResizeListener(onResize, _ref) {
  var itemsContainerElement = _ref.itemsContainerElement;

  var onResizeListener = function onResizeListener() {
    // By default, `VirtualScroller` always performs a re-layout
    // on window `resize` event. But browsers (Chrome, Firefox)
    // [trigger](https://developer.mozilla.org/en-US/docs/Web/API/Window/fullScreen#Notes)
    // window `resize` event also when a user switches into fullscreen mode:
    // for example, when a user is watching a video and double-clicks on it
    // to maximize it. And also when the user goes out of the fullscreen mode.
    // Each such fullscreen mode entering/exiting will trigger window `resize`
    // event that will it turn trigger a re-layout of `VirtualScroller`,
    // resulting in bad user experience. To prevent that, such cases are filtered out.
    // Some other workaround:
    // https://stackoverflow.com/questions/23770449/embedded-youtube-video-fullscreen-or-causing-resize
    if (document.fullscreenElement) {
      // If the fullscreened element doesn't contain the list
      // (and is not the list itself), then the layout hasn't been affected,
      // so don't perform a re-layout.
      //
      // For example, suppose there's a list of items, and some item contains a video.
      // If, upon clicking such video, it plays inline, and the user enters
      // fullscreen mode while playing such inline video, then the layout won't be
      // affected, and so such `resize` event should be ignored: when
      // `document.fullscreenElement` is in a separate "branch" relative to the
      // `container`.
      //
      // Another scenario: suppose that upon click, the video doesn't play inline,
      // but instead a "Slideshow" component is open, with the video shown at the
      // center of the screen in an overlay. If then the user enters fullscreen mode,
      // the layout wouldn't be affected too, so such `resize` event should also be
      // ignored: when `document.fullscreenElement` is inside the `container`.
      //
      if (document.fullscreenElement.contains(itemsContainerElement)) {// The element is either the `container`'s ancestor,
        // Or is the `container` itself.
        // (`a.contains(b)` includes the `a === b` case).
        // So the `resize` event will affect the `container`'s dimensions.
      } else {
        // The element is either inside the `container`,
        // Or is in a separate tree.
        // So the `resize` event won't affect the `container`'s dimensions.
        return;
      }
    }

    onResize();
  };

  window.addEventListener('resize', onResizeListener);
  return function () {
    return window.removeEventListener('resize', onResizeListener);
  };
}
//# sourceMappingURL=ScrollableContainer.js.map