import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import { inject as service } from '@ember/service';

export default class ConceptSchemeUriSelectorComponent extends Component {
  @service store;

  @tracked selected;
  @tracked options;

  constructor() {
    super(...arguments);

    this.loadOptions();
  }

  async getconceptSchemeByUri(uri) {
    const conceptSchemes = await this.store.query('concept-scheme', {
      filter: {
        ':uri:': uri,
      },
    });
    if (conceptSchemes && conceptSchemes.length >= 1) {
      return conceptSchemes[0];
    }

    return null;
  }

  @action
  async loadSelected() {
    if (!this.args.forField.conceptSchemeUriOption) {
      return;
    }

    const uri = this.args.forField.conceptSchemeUriOption;

    if (uri) {
      const conceptScheme = await this.getconceptSchemeByUri(uri);

      await this.setSelected({
        uri: uri,
        label: conceptScheme ? conceptScheme.label : uri,
      });
    }
  }

  @action
  async loadOptions() {
    const conceptSchemes = await this.store.query('concept-scheme', {});

    this.options = this.getSortedOptions(conceptSchemes);

    if (this.args.forField) {
      await this.loadSelected();
    }
  }

  async update() {
    const concepts = await this.store.query('concept', {
      filter: {
        'concept-schemes': {
          ':uri:': this.selected.uri,
        },
      },
    });
    this.args.update({
      uri: this.selected.uri,
      concepts: [...concepts].map((concept) => concept.label),
      field: this.args.forField,
    });
  }

  @action
  async setSelected(value) {
    this.selected = value;
    await this.update();
  }

  getSortedOptions(conceptSchemeModels) {
    return [...conceptSchemeModels].sort(function (a, b) {
      if (a.label < b.label) {
        return -1;
      }
      if (a.label > b.label) {
        return 1;
      }
      return 0;
    });
  }
}
