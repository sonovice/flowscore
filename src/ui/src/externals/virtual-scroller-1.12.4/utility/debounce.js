// For some weird reason, in Chrome, `setTimeout()` would lag up to a second (or more) behind.
// Turns out, Chrome developers have deprecated `setTimeout()` API entirely without asking anyone.
// Replacing `setTimeout()` with `requestAnimationFrame()` can work around that Chrome bug.
// https://github.com/bvaughn/react-virtualized/issues/722
import { setTimeout, clearTimeout } from 'request-animation-frame-timeout';
/**
 * Same as `lodash`'s `debounce()` for functions with no arguments.
 * @param  {function} func — The function.
 * @param  {number} interval
 * @param  {function} [options.onStart]
 * @param  {function} [options.onStop]
 * @return {function} A function that returns a `Promise` which resolves when the underlying (original) function gets executed.
 */

export default function debounce(func, interval) {
  var _ref = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {},
      onStart = _ref.onStart,
      onStop = _ref.onStop;

  var timeout;
  return function () {
    var _this = this;

    for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    return new Promise(function (resolve) {
      if (timeout) {
        clearTimeout(timeout);
      } else {
        if (onStart) {
          onStart();
        }
      }

      timeout = setTimeout(function () {
        timeout = undefined;

        if (onStop) {
          onStop();
        }

        func.apply(_this, args);
        resolve();
      }, interval);
    });
  };
}
//# sourceMappingURL=debounce.js.map