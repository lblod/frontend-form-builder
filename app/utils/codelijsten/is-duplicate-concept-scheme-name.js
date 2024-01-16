export async function isDuplicateConceptSchemeName(self, name, store) {
  const duplicates = await store.query('concept-scheme', {
    filter: {
      ':exact:preflabel': name,
    },
  });

  if (duplicates.length == 1 && duplicates[0].id == self.id) {
    return false;
  }

  return duplicates.length !== 0;
}
