import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import fetch from 'fetch'

const SPARQL_ENDPOINT = "/sparql"

export default class InputTypesListComponent extends Component {
  @tracked inputTypes = [];

  get sortedInputTypes() {
    return this.inputTypes.sort((a,b) => (a.label.value > b.label.value));
  }

  queryInputTypes = `
    PREFIX ext: <http://mu.semte.ch/vocabularies/ext/>

    SELECT DISTINCT ?inputType ?label ?displayType ?usesConceptScheme {
      ?inputType skos:inScheme <http://lblod.data.gift/concept-schemes/c5a91bd7-3eb5-4d69-a51b-9bac6bf345f6> ;
        skos:prefLabel ?label ;
        ext:displayType ?displayType ;
        ext:usesConceptScheme ?usesConceptScheme .
    }
  `;

  queryValidations = function(inputType) {
    return `
    PREFIX ext: <http://mu.semte.ch/vocabularies/ext/>

    SELECT DISTINCT ?validation ?label ?validatonName {
      <${inputType}> ext:canHaveValidation ?validation .
      ?validation skos:prefLabel ?label ;
        ext:validationName ?validatonName .
    }
  `;
  }

  constructor() {
    super(...arguments);
    this.getInputTypes(this.queryInputTypes, this.queryValidations);
  }

  async getInputTypes(queryInputTypes, queryValidations) {
    const encodedQueryInputTypes = escape(queryInputTypes);
    const endpointInputTypes = `${SPARQL_ENDPOINT}?query=${encodedQueryInputTypes}`;
    const responseInputTypes = await fetch(endpointInputTypes, { headers: {'Accept': 'application/sparql-results+json' } });
    
    if (responseInputTypes.ok) {
      let jsonResponseInputTypes = await responseInputTypes.json();
      this.inputTypes = jsonResponseInputTypes.results.bindings;

      for (const inputType of this.inputTypes) {
        const encodedQueryValidations = escape(queryValidations(inputType.inputType.value));
        const endpointValidations = `${SPARQL_ENDPOINT}?query=${encodedQueryValidations}`;
        const responseValidations = await fetch(endpointValidations, { headers: {'Accept': 'application/sparql-results+json' } });

        let jsonResponseValidations = await responseValidations.json();
        const validations = jsonResponseValidations.results.bindings;
        inputType['validations'] = validations;
      }
    } else {
      throw new Error(`Request was unsuccessful: [${response.status}] ${response.statusText}`);
    }
  }
}
