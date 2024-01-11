export function sortObjectsOnProperty(arrayOfObjects, property) {
  return arrayOfObjects.sort((a, b) => {
    if (!a[property]) {
      console.error(`Object has no property '${property}'`, a);
    }
    if (!b[property]) {
      console.error(`Object has no property '${property}'`, b);
      return -1;
    }

    let value = a[property],
      comparison = b[property];

    if (value < comparison) {
      return -1;
    }
    if (value > comparison) {
      return 1;
    }
    return 0;
  });
}