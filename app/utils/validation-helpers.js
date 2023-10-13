import { getLocalFileContentAsText } from '../utils/get-local-file-content';
import { GRAPHS } from '../controllers/formbuilder/edit';
import { sym as RDFNode } from 'rdflib';
import { FORM, RDF } from '../utils/rdflib';

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

export function removeUnassignedNodes(store, exception) {
  const subjectsInForm = store
    .match(undefined, undefined, undefined, validationGraphs.sourceGraph)
    .map((triple) => triple.subject);

  const uniqueSubjects = new Array(...new Set(subjectsInForm));

  const subjectsWithoutExceptions = uniqueSubjects.filter(
    (statement) => statement.value !== exception.value
  );

  for (const subject of subjectsWithoutExceptions) {
    const matchesInObject = store.match(
      undefined,
      undefined,
      subject,
      validationGraphs.sourceGraph
    );
    if (matchesInObject.length == 0 || !matchesInObject) {
      try {
        const subjectTriples = store.match(
          subject,
          undefined,
          undefined,
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

export const templatePrefixes = `@prefix form: <http://lblod.data.gift/vocabularies/forms/> .
@prefix sh: <http://www.w3.org/ns/shacl#> .
@prefix mu: <http://mu.semte.ch/vocabularies/core/> .
@prefix displayTypes: <http://lblod.data.gift/display-types/> .
@prefix ext: <http://mu.semte.ch/vocabularies/ext/> .
@prefix schema: <http://schema.org/> .
@prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .
@prefix nie: <http://www.semanticdesktop.org/ontologies/2007/01/19/nie#> .
@prefix fieldGroups: <http://data.lblod.info/field-groups/> .
@prefix fields: <http://data.lblod.info/fields/> .
@prefix concept: <http://lblod.data.gift/concept-schemes/> .`;

export const templateForValidationOnField = `${templatePrefixes}

##########################################################
# Form
##########################################################
ext:form a form:Form, form:TopLevelForm ;
  form:includes ext:formNodesL .

##########################################################
#  Property-groups
##########################################################
ext:formFieldPg a form:PropertyGroup;
  sh:name "" ;
  sh:order 1 .`;
