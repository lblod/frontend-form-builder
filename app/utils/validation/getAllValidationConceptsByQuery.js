import { CONCEPT_SCHEMES } from '../rdflib';
import fetch from 'fetch';

// NOTE: this is unused for now

async function queryDB(query) {
  const encodedQuery = escape(query);
  const endpoint = `/sparql?query=${encodedQuery}`;
  const response = await fetch(endpoint, {
    headers: { Accept: 'application/sparql-results+json' },
  });

  if (response.ok) {
    let jsonResponds = await response.json();
    return jsonResponds.results.bindings;
  } else {
    throw new Error(
      `Request was unsuccessful: [${response.status}] ${response.statusText}`
    );
  }
}

export async function getAllValidationConceptsByQuery() {
  const validationsListId = 'dde3d2a3-e848-47ea-ba44-0f2e565f04ab';
  const query = `
  SELECT DISTINCT ?uuid ?prefLabel ?validationName {
    ?item <http://www.w3.org/2004/02/skos/core#inScheme> ${CONCEPT_SCHEMES(
      validationsListId
    )} ;
      <http://mu.semte.ch/vocabularies/core/uuid> ?uuid ;
      <http://mu.semte.ch/vocabularies/ext/validationName> ?validationName ;
      <http://www.w3.org/2004/02/skos/core#prefLabel> ?prefLabel .
  }
`;

  let concepts = await queryDB(query);

  return concepts;
}
