import { NamedNode } from 'rdflib';
import { conceptAsStatements } from './viewmodels/concept-as-statements';
import { conceptSchemeAsStatements } from './viewmodels/concept-scheme-as-statements';

export async function getConceptSchemesWithConceptsStatements(store) {
  const conceptSchemes = await store.query('concept-scheme', {
    include: 'concepts',
    page: {
      size: 999,
    },
  });

  const conceptSchemeStatements = conceptSchemes.map((model) =>
    conceptSchemeAsStatements(model)
  );

  const conceptStatements = [];
  for (const conceptScheme of conceptSchemes) {
    const conceptSchemeSubject = new NamedNode(conceptScheme.uri);

    const conceptModels = new Array(...(await conceptScheme.concepts));
    conceptStatements.push(
      ...conceptModels.map((model) =>
        conceptAsStatements(model, conceptSchemeSubject)
      )
    );
  }
  return [...conceptSchemeStatements, ...conceptStatements];
}
