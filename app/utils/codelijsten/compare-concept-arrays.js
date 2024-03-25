export function isConceptArrayChanged(dbConcepts, concepts) {
  if (concepts.length == 0 && dbConcepts.length >= 1) return true;
  if (dbConcepts.length == 0 && concepts.length >= 1) return true;

  const existingConceptIdsOnScheme = dbConcepts.map((concept) => concept.id);
  const existingConceptLabelsOnScheme = dbConcepts.map(
    (concept) => concept.label
  );

  for (const concept of concepts) {
    if (concept.label.trim() == '') {
      return true;
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
