import { createCompletionsFor } from '../create-completion-for';

export function getPrefixCompletions() {
  return createCompletionsFor(
    {
      type: `variable`,
      section: `@prefix`,
      info: `Prefix aliases`,
      boost: -99, // This is not doing anything IMO
    },
    [
      `@prefix : <#>.`,
      `@prefix dct: <http://purl.org/dc/terms/>.`,
      `@prefix foaf: <http://xmlns.com/foaf/0.1/>.`,
      `@prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>.`,
      `@prefix schema: <http://schema.org/>.`,
      `@prefix form: <http://lblod.data.gift/vocabularies/forms/>.`,
      `@prefix sh: <http://www.w3.org/ns/shacl#>.`,
      `@prefix displayTypes: <http://lblod.data.gift/display-types/>.`,
      `@prefix ext: <http://mu.semte.ch/vocabularies/ext/>.`,
      `@prefix lblodSubsidie: <http://lblod.data.gift/vocabularies/subsidie/>.`,
      `@prefix nodes: <http://data.lblod.info/form-data/nodes/>.`,
    ]
  );
}
