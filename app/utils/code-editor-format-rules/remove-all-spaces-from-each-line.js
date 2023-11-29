export async function getDocWithAllSpacesRemovedFromEachLine(doc) {
  return new Promise((resolve) => {
    const newDoc = [];
    for (const text of doc) {
      const trimmedText = text.trim();
      if (trimmedText !== '') {
        newDoc.push(trimmedText);
      }
    }

    resolve(newDoc);
  });
}
