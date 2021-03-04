import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import fetch from 'fetch'

const SPARQL_ENDPOINT = "http://localhost:8890/sparql"

export default class ConceptSchemeUriSelectorComponent extends Component {

  @tracked options = []
  @tracked selected;

  query = `
    SELECT DISTINCT * {
      ?uri a <http://www.w3.org/2004/02/skos/core#ConceptScheme>;
        <http://www.w3.org/2004/02/skos/core#prefLabel> ?prefLabel.
    }
  `

  constructor() {
    super(...arguments)
    this.getSchemeLabels(this.query)
  }

  @action
  setSelected(value){
    this.selected = value
  }

  async getSchemeLabels(query) {
    const encodedQuery = escape(query);
    const endpoint = `${SPARQL_ENDPOINT}?query=${encodedQuery}`;
    const response = await fetch(endpoint, { headers: {'Accept': 'application/sparql-results+json' } });

    if (response.ok) {
      let jsonResponds = await response.json();
      this.options = jsonResponds.results.bindings
    } else {
      throw new Error(`Request was unsuccessful: [${response.status}] ${response.statusText}`);
    }
  }
}
