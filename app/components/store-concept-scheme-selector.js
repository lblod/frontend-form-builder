import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import { queryDB } from '../utils/query-sparql-query';

export default class StoreConceptSchemeSelectorComponent extends Component {
  @tracked selected;
  @tracked options;

  constructor() {
    super(...arguments);
    if (!this.args.field.rdflibOptions) {
      this.selected = null;
      this.options = [];

      return;
    }

    this.loadOptions();
  }

  get fieldName() {
    return this.args.field.rdflibLabel ?? '';
  }

  async loadOptions() {
    const config = this.getOptionConfigurationFromField(this.args.field);
    if (config.conceptScheme) {
      this.options = await queryDB(
        this.getUriAndLabelForSchemeQuery(config.conceptScheme)
      );
    } else {
      console.warn(`Key "conceptScheme" not found in json configuration`);
    }
  }

  @action
  setSelected(value) {
    this.selected = value;
    // What should happen here?
  }

  getOptionConfigurationFromField(field) {
    const dropdownConfigurationLiteral = field.rdflibOptions;
    let configurationAsJson = {};
    try {
      configurationAsJson = JSON.parse(
        dropdownConfigurationLiteral.value.trim()
      );
    } catch (error) {
      console.error(`Catched: could not parse configuration into json object.`);
    }

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
