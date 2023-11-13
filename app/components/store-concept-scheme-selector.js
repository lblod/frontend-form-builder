import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import { queryDB } from '../utils/query-sparql-query';

export default class StoreConceptSchemeSelectorComponent extends Component {
  @tracked selected;
  @tracked options;

  constructor() {
    super(...arguments);

    this.loadOptions();
  }

  async loadOptions() {
    const conceptScheme = this.getOptionConfigurationFromField(
      this.args.field
    ).conceptScheme;

    this.options = await queryDB(
      this.getUriAndLabelForSchemeQuery(conceptScheme)
    );
  }

  @action
  setSelected(value) {
    this.selected = value;
    // What should happen here?
  }

  getOptionConfigurationFromField(field) {
    const dropdownConfigurationLiteral = field.rdflibOptions;
    const configurationAsJson = JSON.parse(
      dropdownConfigurationLiteral.value.trim()
    );

    return configurationAsJson;
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
