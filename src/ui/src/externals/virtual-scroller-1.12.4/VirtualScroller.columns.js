export default function createColumnsHelpers(_ref) {
  var _this = this;

  var getColumnsCount = _ref.getColumnsCount;

  if (getColumnsCount) {
    var scrollableContainerArgument = {
      getWidth: function getWidth() {
        return _this.scrollableContainer.getWidth();
      }
    };

    this.getActualColumnsCountForState = function () {
      var columnsCount = getColumnsCount(scrollableContainerArgument); // `columnsCount: 1` is effectively same as `columnsCount: undefined`
      // from the code's point of view. This makes one less property in `state`
      // which makes `state` a bit less cluttered (easier for inspection).

      if (columnsCount !== 1) {
        return columnsCount;
      }
    };
  } else {
    this.getActualColumnsCountForState = function () {
      return undefined;
    };
  }

  this.getActualColumnsCount = function () {
    return _this.getActualColumnsCountForState() || 1;
  };

  this.getColumnsCount = function () {
    return _this.getState() && _this.getState().columnsCount || 1;
  };
}
//# sourceMappingURL=VirtualScroller.columns.js.map