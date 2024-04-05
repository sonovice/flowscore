function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _unsupportedIterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _iterableToArray(iter) { if (typeof Symbol !== "undefined" && iter[Symbol.iterator] != null || iter["@@iterator"] != null) return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) return _arrayLikeToArray(arr); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

export default function log() {
  if (isDebug()) {
    var _console;

    for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    (_console = console).log.apply(_console, _toConsumableArray(['[virtual-scroller]'].concat(args)));
  }
}
export function warn() {
  if (isWarn()) {
    var _console2;

    for (var _len2 = arguments.length, args = new Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
      args[_key2] = arguments[_key2];
    }

    if (warningsAreErrors()) {
      return reportError.apply(this, args);
    }

    (_console2 = console).warn.apply(_console2, _toConsumableArray(['[virtual-scroller]'].concat(args)));
  }
}

function error() {
  var _console3;

  for (var _len3 = arguments.length, args = new Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {
    args[_key3] = arguments[_key3];
  }

  (_console3 = console).error.apply(_console3, _toConsumableArray(['[virtual-scroller]'].concat(args)));
}

export function reportError() {
  for (var _len4 = arguments.length, args = new Array(_len4), _key4 = 0; _key4 < _len4; _key4++) {
    args[_key4] = arguments[_key4];
  }

  var createError = function createError() {
    return new Error(['[virtual-scroller]'].concat(args).join(' '));
  };

  if (typeof window !== 'undefined') {
    // In a web browser.
    // Output a debug message immediately so that it's known
    // at which point did the error occur between other debug logs.
    error.apply(this, ['ERROR'].concat(args));
    setTimeout(function () {
      // Throw an error in a timeout so that it doesn't interrupt the application's flow.
      // At the same time, by throwing a client-side error, such error could be spotted
      // in some error monitoring software like `sentry.io`, while also being visible
      // in the console.
      // The `.join(' ')` part doesn't support stringifying JSON objects,
      // but those don't seem to be used in any of the error messages.
      throw createError();
    }, 0);
  } else {
    // In Node.js.
    // If tests are being run, throw in case of any errors.
    var catchError = getGlobalVariable('VirtualScrollerCatchError');

    if (catchError) {
      return catchError(createError());
    }

    if (getGlobalVariable('VirtualScrollerThrowErrors')) {
      throw createError();
    } // Print the error in the console.


    error.apply(this, ['ERROR'].concat(args));
  }
}
export function isDebug() {
  var debug = getDebug();

  if (debug !== undefined) {
    return debug === true || debug === 'debug';
  }
}
export function isWarn() {
  // const debug = getDebug()
  // return debug === undefined
  // 	|| debug === true
  // 	|| debug === 'debug'
  // 	|| debug === 'warn'
  //
  return true;
}

function getDebug() {
  return getGlobalVariable('VirtualScrollerDebug');
}

function warningsAreErrors() {
  return getGlobalVariable('VirtualScrollerWarningsAreErrors');
}

function getGlobalVariable(name) {
  if (typeof window !== 'undefined') {
    return window[name];
  } else if (typeof global !== 'undefined') {
    return global[name];
  }
}
//# sourceMappingURL=debug.js.map