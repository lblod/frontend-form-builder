import { FORM } from '@lblod/submission-form-helpers';

export async function findTtlForUsedConceptSchemesInForm(
  formStore,
  database,
  graph
) {
  const ttlCodeArray = [];
  const uris = getConceptSchemeUrisInTtl(formStore, graph);

  if (uris.length == 0) {
    return;
  }

  for (const conceptSchemeUri of uris) {
    const conceptSchemes = await database.query('concept-scheme', {
      include: 'concepts',
      filter: {
        ':uri:': conceptSchemeUri,
      },
    });
    const conceptSchemesAsArray = [...conceptSchemes];
    const ttl = await conceptSchemesWithConceptsToTtl(conceptSchemesAsArray);
    ttlCodeArray.push(ttl);
  }

  return ttlCodeArray.join('\n');
}

async function conceptSchemesWithConceptsToTtl(conceptSchemes) {
  const ttlArray = [];
  for (const conceptScheme of conceptSchemes) {
    ttlArray.push(await conceptScheme.modelWithConceptsAsTtlCode());
  }

  return ttlArray.join(' ');
}

function getConceptSchemeUrisInTtl(formStore, graph) {
  const formOptions = formStore.match(
    undefined,
    FORM('options'),
    undefined,
    graph
  );

  const conceptSchemeUris = [];
  for (const triple of formOptions) {
    const optionsAsString = triple.object;
    try {
      const jsonOptions = JSON.parse(optionsAsString);
      conceptSchemeUris.push(jsonOptions.conceptScheme);
    } catch (error) {
      return;
    }
  }
  return conceptSchemeUris;
}
