export function isConceptListChanged(dbConcepts, concepts) {
  if (concepts.length == 0) return false;

  const existingConceptIdsOnScheme = dbConcepts.map((concept) => concept.id);
  const existingConceptLabelsOnScheme = dbConcepts.map(
    (concept) => concept.label
  );

  for (const concept of concepts) {
    if (concept.label.trim() == '') {
      return false;
    }

    if (!existingConceptIdsOnScheme.includes(concept.id)) {
      return true;
    }
    if (!existingConceptLabelsOnScheme.includes(concept.label)) {
      return true;
    }
  }

  return false;
}
