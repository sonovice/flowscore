export default function fillArray(array, getItem) {
  var i = 0;

  while (i < array.length) {
    array[i] = getItem(i);
    i++;
  }

  return array;
}
//# sourceMappingURL=fillArray.js.map