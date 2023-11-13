import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import { queryDB } from '../utils/query-sparql-query';
import { inject as service } from '@ember/service';

export default class StoreConceptSchemeSelectorComponent extends Component {
  @tracked selected;
  @tracked options;

  @service toaster;

  constructor() {
    super(...arguments);
    if (!this.args.field.rdflibOptions) {
      this.toaster.warning(
        'Je hebt geen configuratie meegegeven voor de dropdown.',
        'Geen configuratie',
        {
          timeOut: 2000,
        }
      );
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
