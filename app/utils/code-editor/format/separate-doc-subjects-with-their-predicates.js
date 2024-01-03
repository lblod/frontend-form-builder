import { getDocWithAllSpacesRemovedFromEachLine } from './rules/remove-all-spaces-from-each-line';

export async function splitDocPerSubject(doc) {
  const trimmedDoc = await getDocWithAllSpacesRemovedFromEachLine(doc);

  return new Promise((resolve) => {
    // rename this: holds all separate subjects with their predicates
    const parts = [];
    let currentSubjectParts = [];

    for (const line of trimmedDoc) {
      currentSubjectParts.push(line);

      // Every part in turtle ends with a dot
      if (line.slice(-1) == '.') {
        parts.push([...currentSubjectParts]);
        currentSubjectParts = [];
      }
    }

    resolve(parts);
  });
}
