function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); Object.defineProperty(Constructor, "prototype", { writable: false }); return Constructor; }

import ItemNotRenderedError from '../ItemNotRenderedError.js';

var ItemsContainer = /*#__PURE__*/function () {
  /**
   * Constructs a new "container" from an element.
   * @param {function} getElement
   */
  function ItemsContainer(getElement) {
    _classCallCheck(this, ItemsContainer);

    this.getElement = getElement;
  }

  _createClass(ItemsContainer, [{
    key: "_getNthRenderedItemElement",
    value: function _getNthRenderedItemElement(renderedElementIndex) {
      var childNodes = this.getElement().childNodes;

      if (renderedElementIndex > childNodes.length - 1) {
        // console.log('~ Items Container Contents ~')
        // console.log(this.getElement().innerHTML)
        throw new ItemNotRenderedError({
          renderedElementIndex: renderedElementIndex,
          renderedElementsCount: childNodes.length
        });
      }

      return childNodes[renderedElementIndex];
    }
    /**
     * Returns an item element's "top offset", relative to the items `container`'s top edge.
     * @param  {number} renderedElementIndex — An index of an item relative to the "first shown item index". For example, if the list is showing items from index 8 to index 12 then `renderedElementIndex = 0` would mean the item at index `8`.
     * @return {number}
     */

  }, {
    key: "getNthRenderedItemTopOffset",
    value: function getNthRenderedItemTopOffset(renderedElementIndex) {
      return this._getNthRenderedItemElement(renderedElementIndex).getBoundingClientRect().top - this.getElement().getBoundingClientRect().top;
    }
    /**
     * Returns an item element's height.
     * @param  {number} renderedElementIndex — An index of an item relative to the "first shown item index". For example, if the list is showing items from index 8 to index 12 then `renderedElementIndex = 0` would mean the item at index `8`.
     * @return {number}
     */

  }, {
    key: "getNthRenderedItemHeight",
    value: function getNthRenderedItemHeight(renderedElementIndex) {
      // `offsetHeight` is not precise enough (doesn't return fractional pixels).
      // return this._getNthRenderedItemElement(renderedElementIndex).offsetHeight
      return this._getNthRenderedItemElement(renderedElementIndex).getBoundingClientRect().height;
    }
    /**
     * Returns items container height.
     * @return {number}
     */

  }, {
    key: "getHeight",
    value: function getHeight() {
      // `offsetHeight` is not precise enough (doesn't return fractional pixels).
      // return this.getElement().offsetHeight
      return this.getElement().getBoundingClientRect().height;
    }
    /**
     * Removes all item elements of an items container.
     */

  }, {
    key: "clear",
    value: function clear() {
      while (this.getElement().firstChild) {
        this.getElement().removeChild(this.getElement().firstChild);
      }
    }
  }]);

  return ItemsContainer;
}();

export { ItemsContainer as default };
//# sourceMappingURL=ItemsContainer.js.map