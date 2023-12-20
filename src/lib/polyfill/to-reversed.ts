if (!("toReversed" in Array.prototype)) {
  (Array.prototype as Array<unknown>).toReversed = function () {
    const array = [...this];
    return array.reverse();
  };
}
