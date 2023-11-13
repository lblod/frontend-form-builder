import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import { queryDB } from '../utils/query-sparql-query';

export default class ConceptSchemeUriSelectorComponent extends Component {
  @tracked selected;
  @tracked options;

  constructor() {
    super(...arguments);
    this.loadOptions();
  }

  async loadOptions() {
    this.options = await queryDB(`
    SELECT DISTINCT * {
      ?uri a <http://www.w3.org/2004/02/skos/core#ConceptScheme>;
        <http://www.w3.org/2004/02/skos/core#prefLabel> ?prefLabel.
    }
  `);
  }

  async update() {
    let concepts = await queryDB(`
      SELECT DISTINCT ?prefLabel {
        ?s <http://www.w3.org/2004/02/skos/core#inScheme> <${this.selected.uri.value}>;
        <http://www.w3.org/2004/02/skos/core#prefLabel> ?prefLabel.
      }
    `);

    this.args.update({
      uri: this.selected.uri.value,
      concepts: concepts.map((concept) => concept.prefLabel.value),
    });
  }

  @action
  setSelected(value) {
    this.selected = value;
    this.update();
  }
}
