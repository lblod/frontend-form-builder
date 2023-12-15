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

  @action
  async loadOptions() {
    const conceptSchemes = await this.store.query('concept-scheme', {});

    this.options = this.getSortedOptions(conceptSchemes);
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
    });
  }

  @action
  setSelected(value) {
    this.selected = value;
    this.update();
  }

  getSortedOptions(conceptSchememodels) {
    return [...conceptSchememodels].sort(function (a, b) {
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
