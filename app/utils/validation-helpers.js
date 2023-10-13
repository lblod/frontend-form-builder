import { getLocalFileContentAsText } from '../utils/get-local-file-content';
import { GRAPHS } from '../controllers/formbuilder/edit';
import { sym as RDFNode } from 'rdflib';
import { EXT, FORM, RDF } from '../utils/rdflib';
import {
  getAllTriples,
  getTriplesWithNodeAsSubject,
  getTriplesWithNodeAsObject,
} from './forking-store-helpers';

export const validationGraphs = {
  ...GRAPHS,
  fieldGraph: new RDFNode(`http://data.lblod.info/fieldGraph`),
  sourceBuilderGraph: new RDFNode(`http://data.lblod.info/sourceBuilderGraph`),
};

export async function parseStoreGraphs(store, ttlCode) {
  store.parse(
    await getLocalFileContentAsText('/forms/validation/form.ttl'),
    validationGraphs.formGraph,
    'text/turtle'
  );
  store.parse(
    await getLocalFileContentAsText('/forms/validation/meta.ttl'),
    validationGraphs.metaGraph,
    'text/turtle'
  );
  store.parse(
    await getLocalFileContentAsText('/forms/builder/meta.ttl'),
    validationGraphs.fieldGraph,
    'text/turtle'
  );
  store.parse(ttlCode, validationGraphs.sourceGraph, 'text/turtle');
}

export function getFirstFieldSubject(store) {
  return store.any(
    undefined,
    RDF('type'),
    FORM('Field'),
    validationGraphs.sourceGraph
  );
}

export function getPossibleValidationsForDisplayType(
  displayType,
  store,
  graph
) {
  return store
    .match(displayType, EXT('canHaveValidation'), undefined, graph)
    .map((triple) => triple.object);
}

export function removeUnassignedNodesFromGraph(store, exception) {
  const subjectsInForm = getAllTriples(store, validationGraphs.sourceGraph).map(
    (triple) => triple.subject
  );
  const uniqueSubjects = new Array(...new Set(subjectsInForm));

  const subjectsWithoutExceptions = uniqueSubjects.filter(
    (statement) => statement.value !== exception.value
  );

  for (const subject of subjectsWithoutExceptions) {
    const matchesInObject = getTriplesWithNodeAsObject(
      subject,
      store,
      validationGraphs.sourceGraph
    );

    if (matchesInObject.length == 0 || !matchesInObject) {
      try {
        const subjectTriples = getTriplesWithNodeAsSubject(
          subject,
          store,
          validationGraphs.sourceGraph
        );

        store.removeStatements(subjectTriples);
      } catch (error) {
        console.error(
          `Could not remove subject with predicates for`,
          subject,
          error
        );
      }
    }
  }
}
