export const fieldValidationFormTemplate = `
@prefix form: <http://lblod.data.gift/vocabularies/forms/> .
@prefix sh: <http://www.w3.org/ns/shacl#> .
@prefix mu: <http://mu.semte.ch/vocabularies/core/> .
@prefix displayTypes: <http://lblod.data.gift/display-types/> .
@prefix ext: <http://mu.semte.ch/vocabularies/ext/> .
@prefix schema: <http://schema.org/> .
@prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .
@prefix nie: <http://www.semanticdesktop.org/ontologies/2007/01/19/nie#> .
@prefix fieldGroups: <http://data.lblod.info/field-groups/> .
@prefix fields: <http://data.lblod.info/fields/> .
@prefix concept: <http://lblod.data.gift/concept-schemes/> .

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
    sh:order 1 .
`;
