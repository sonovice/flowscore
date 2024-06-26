// For some weird reason, in Chrome, `setTimeout()` would lag up to a second (or more) behind.
// Turns out, Chrome developers have deprecated `setTimeout()` API entirely without asking anyone.
// Replacing `setTimeout()` with `requestAnimationFrame()` can work around that Chrome bug.
// https://github.com/bvaughn/react-virtualized/issues/722
import { setTimeout, clearTimeout } from 'request-animation-frame-timeout';
/**
 * Same as `lodash`'s `throttle()` for functions with no arguments.
 * @param  {function} func
 * @param  {number} interval
 * @return {function}
 */

export default function throttle(func, interval) {
  var timeout;
  var executedAt = 0;

  var scheduled = function scheduled() {
    timeout = undefined;
    executedAt = Date.now();
    func();
  };

  return function () {
    var now = Date.now();
    var remaining = interval - (now - executedAt);

    if (remaining <= 0) {
      if (timeout) {
        clearTimeout(timeout);
        timeout = undefined;
      }

      executedAt = now;
      func();
    } else if (!timeout) {
      timeout = setTimeout(scheduled, remaining);
    }
  };
}
//# sourceMappingURL=throttle.js.map