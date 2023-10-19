import { getLocalFileContentAsText } from '../get-local-file-content';
import { GRAPHS } from '../../controllers/formbuilder/edit';
import { sym as RDFNode } from 'rdflib';
import { EXT, FORM, RDF } from '../rdflib';

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
