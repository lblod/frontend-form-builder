export function sortObjectsOnProperty(arrayOfObjects, property) {
  return arrayOfObjects.sort((a, b) => {
    if (!a[property]) {
      console.error(`Object heeft geen attribuut '${property}'`, a);
    }
    if (!b[property]) {
      console.error(`Object heeft geen attribuut '${property}'`, b);
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
