// A workaround for `<tbody/>` not being able to have `padding`.
// https://gitlab.com/catamphetamine/virtual-scroller/-/issues/1
import px from '../utility/px.js';
export var BROWSER_NOT_SUPPORTED_ERROR = 'It looks like you\'re using Internet Explorer which doesn\'t support CSS variables required for a <tbody/> container. VirtualScroller has been switched into "bypass" mode (render all items). See: https://gitlab.com/catamphetamine/virtual-scroller/-/issues/1';
export function supportsTbody() {
  // Detect Internet Explorer.
  // https://stackoverflow.com/questions/19999388/check-if-user-is-using-ie
  // `documentMode` is an IE-only property.
  // Supports IE 9-11. Maybe even IE 8.
  // http://msdn.microsoft.com/en-us/library/ie/cc196988(v=vs.85).aspx
  if (typeof window !== 'undefined' && window.document.documentMode) {
    // CSS variables aren't supported in Internet Explorer.
    return false;
  }

  return true;
}
export var TBODY_CLASS_NAME = 'VirtualScroller';
var STYLE_ELEMENT_ID = 'VirtualScrollerStyle';
export function hasTbodyStyles(tbody) {
  return tbody.classList.contains(TBODY_CLASS_NAME) && Boolean(document.getElementById(STYLE_ELEMENT_ID));
}
export function addTbodyStyles(tbody) {
  // `classList.add` is supported in Internet Explorer 10+.
  tbody.classList.add(TBODY_CLASS_NAME); // Create a `<style/>` element.

  var style = document.createElement('style');
  style.id = STYLE_ELEMENT_ID; // CSS variables aren't supported in Internet Explorer.

  style.innerText = "\n\t\ttbody.".concat(TBODY_CLASS_NAME, ":before {\n\t\t\tcontent: '';\n\t\t\tdisplay: table-row;\n\t\t\theight: var(--VirtualScroller-paddingTop);\n\t\t}\n\t\ttbody.").concat(TBODY_CLASS_NAME, ":after {\n\t\t\tcontent: '';\n\t\t\tdisplay: table-row;\n\t\t\theight: var(--VirtualScroller-paddingBottom);\n\t\t}\n\t").replace(/[\n\t]/g, '');
  document.head.appendChild(style);
}
export function setTbodyPadding(tbody, beforeItemsHeight, afterItemsHeight) {
  // CSS variables aren't supported in Internet Explorer.
  tbody.style.setProperty('--VirtualScroller-paddingTop', px(beforeItemsHeight));
  tbody.style.setProperty('--VirtualScroller-paddingBottom', px(afterItemsHeight));
}
//# sourceMappingURL=tbody.js.map