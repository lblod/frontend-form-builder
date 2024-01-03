export function findValueOnIndex(items, index) {
  if (typeof items[index] === 'undefined') {
    return undefined;
  }

  return items[index];
}
