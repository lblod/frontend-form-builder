import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import fetch from 'fetch'

const SPARQL_ENDPOINT = "/sparql"

export default class InputTypesListComponent extends Component {
  @tracked inputTypes = [];

  get sortedInputTypes() {
    return this.inputTypes.sort((a,b) => (a.label.value > b.label.value));
  }

  query = `
    PREFIX ext: <http://mu.semte.ch/vocabularies/ext/>

    SELECT DISTINCT ?concept ?label ?displayType ?usesConceptScheme {
      ?concept skos:inScheme <http://lblod.data.gift/concept-schemes/c5a91bd7-3eb5-4d69-a51b-9bac6bf345f6> ;
        skos:prefLabel ?label ;
        ext:displayType ?displayType ;
        ext:usesConceptScheme ?usesConceptScheme .
    }
  `

  constructor() {
    super(...arguments)
    this.getInputTypes(this.query)
  }

  async getInputTypes(query) {
    const encodedQuery = escape(query);
    const endpoint = `${SPARQL_ENDPOINT}?query=${encodedQuery}`;
    const response = await fetch(endpoint, { headers: {'Accept': 'application/sparql-results+json' } });

    if (response.ok) {
      let jsonResponse = await response.json();
      this.inputTypes = jsonResponse.results.bindings
    } else {
      throw new Error(`Request was unsuccessful: [${response.status}] ${response.statusText}`);
    }
  }
}
