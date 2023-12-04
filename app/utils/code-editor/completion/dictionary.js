export default [
  // section: form predicates //
  ...createCompletionsFor(
    {
      type: `keyword`,
      section: `form types`,
      info: `Form types`,
      boost: 99, // This is not doing anything IMO
    },
    [
      `a form:Field ;`,
      `a form:PropertyGroup ;`,
      `a form:Listing ;`,
      `a form:SubForm ;`,
      `a form:Scope ;`,
      `a form:Generator ;`,
    ]
  ),
  // section: form predicates //
  ...createCompletionsFor(
    {
      type: `keyword`,
      section: `Form`,
      info: `Form predicates`,
      boost: 98, // This is not doing anything IMO
    },
    [
      `form:displayType `,
      `form:grouping `,
      `form:validations [] ;`,
      `form:help """""" ;`,
    ]
  ),
  // section: sh predicates //
  ...createCompletionsFor(
    {
      type: `keyword`,
      section: `SHACL`,
      info: `Form predicates`,
      boost: 98, // This is not doing anything IMO
    },
    [
      `sh:name `,
      `sh:group `,
      `sh:order `,
      `sh:path `,
      `sh:description """""" ;`,
      `sh:resultMessage "" ;`,
    ]
  ),
  // section: prefixes //
  ...createCompletionsFor(
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
  ),
];

function createCompletionsFor({ type, info, section, boost }, array) {
  return array.map((prefix) => {
    return {
      label: prefix,
      type: type,
      info: info,
      section: section,
      boost: boost,
    };
  });
}
