export function isConceptArrayChanged(dbConcepts, concepts) {
  if (concepts.length == 0 && dbConcepts.length >= 1) return true;
  if (dbConcepts.length == 0 && concepts.length >= 1) return true;

  const existingConceptIdsOnScheme = dbConcepts.map((concept) => concept.id);
  const existingConceptLabelsOnScheme = dbConcepts.map(
    (concept) => concept.label
  );
  dbConcepts.sort((a, b) => a.order - b.order);
  concepts.sort((a, b) => a.order - b.order);

  for (let index = 0; index < concepts.length; index++) {
    const concept = concepts[index];
    if (concept.label.trim() == '') {
      return true;
    }

    if (!existingConceptIdsOnScheme.includes(concept.id)) {
      return true;
    }
    if (!existingConceptLabelsOnScheme.includes(concept.label)) {
      return true;
    }
    if (
      dbConcepts[index].id !== concept.id &&
      dbConcepts[index].order == concept.order
    ) {
      return true;
    }
  }

  return false;
}
