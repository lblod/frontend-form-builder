import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import fetch from 'fetch'

const SPARQL_ENDPOINT = "/sparql"

export default class ConceptSchemeUriSelectorComponent extends Component {

  @tracked selected;
  @tracked options;
  @tracked codeList;

  constructor() {
    super(...arguments)
    this.loadOptions()
  }

  async loadOptions() {
    this.options = await this.queryDB(`
    SELECT DISTINCT * {
      ?uri a <http://www.w3.org/2004/02/skos/core#ConceptScheme>;
        <http://www.w3.org/2004/02/skos/core#prefLabel> ?prefLabel.
    }
  `)
  }

  async loadCodeList() {
    this.codeList = await this.queryDB(`
      SELECT DISTINCT * {
        ?p ?o  <${this.selected.uri.value}>;
        <http://www.w3.org/2004/02/skos/core#prefLabel> ?prefLabel.
      }
      LIMIT 10
    `)
  }


  @action
  setSelected(value){
    this.selected = value
    this.loadCodeList()
  }

  async queryDB(query) {
    const encodedQuery = escape(query);
    const endpoint = `${SPARQL_ENDPOINT}?query=${encodedQuery}`;
    const response = await fetch(endpoint, { headers: {'Accept': 'application/sparql-results+json' } });

    if (response.ok) {
      let jsonResponds = await response.json();
      return jsonResponds.results.bindings
    } else {
      throw new Error(`Request was unsuccessful: [${response.status}] ${response.statusText}`);
    }
  }
}
