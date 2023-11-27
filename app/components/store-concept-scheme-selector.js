import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import { queryDB } from '../utils/query-sparql-query';

export default class StoreConceptSchemeSelectorComponent extends Component {
  @tracked selected;
  @tracked options;

  constructor() {
    super(...arguments);
    if (!this.args.field.options) {
      this.selected = null;
      this.options = [];

      return;
    }

    this.loadOptions();
  }

  get fieldName() {
    return this.args.field.label ?? '';
  }

  async loadOptions() {
    if (this.args.field.options.conceptScheme) {
      this.options = await queryDB(
        this.getUriAndLabelForSchemeQuery(this.args.field.options.conceptScheme)
      );
    } else {
      console.warn(`Key "conceptScheme" not found in json configuration`);
    }
  }

  @action
  setSelected(value) {
    this.selected = value;
    // This is a display component so it should not do anything
  }

  getUriAndLabelForSchemeQuery(schemeUri) {
    return `
    SELECT DISTINCT ?uri ?prefLabel where {
      ?uri <http://www.w3.org/2004/02/skos/core#inScheme> <${schemeUri}> ;
           <http://www.w3.org/2004/02/skos/core#prefLabel> ?prefLabel
      }
    `;
  }
}
