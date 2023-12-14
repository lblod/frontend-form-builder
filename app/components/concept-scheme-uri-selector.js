import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import { inject as service } from '@ember/service';
import {
  triplesForPath,
  updateSimpleFormValue,
} from '@lblod/submission-form-helpers';
import { Literal } from 'rdflib';

export default class ConceptSchemeUriSelectorComponent extends Component {
  @service store;

  @tracked selected;
  @tracked options;

  constructor() {
    super(...arguments);
    this.loadOptions();
  }

  isForSelectingConceptSchemeOptions() {
    return this.args.field && this.args.formStore && this.args.graphs;
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

    if (this.isForSelectingConceptSchemeOptions()) {
      this.addConceptSchemeOptionsToField();
    } else if (this.args.update) {
      this.args.update({
        uri: this.selected.uri,
        concepts: [...concepts].map((concept) => concept.label),
      });
    } else {
      return;
    }
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

  addConceptSchemeOptionsToField() {
    const { field, graphs, formStore, sourceNode } = this.args;
    const storeOptions = {
      store: formStore,
      path: field.rdflibPath,
      formGraph: graphs.formGraph,
      sourceGraph: graphs.sourceGraph,
      sourceNode: sourceNode,
    };

    // Cleanup old value(s) in the store
    const matches = triplesForPath(this.args, true).values;
    const matchingOptions = matches.filter((m) =>
      this.options.find((opt) => m.equals(opt.subject))
    );
    matchingOptions.forEach((m) =>
      updateSimpleFormValue(storeOptions, undefined, m)
    );

    // Insert new value in the store
    if (this.selected) {
      const optionConfig = {
        conceptScheme: this.selected.uri,
        searchEnabled: true,
      };
      updateSimpleFormValue(
        storeOptions,
        new Literal(JSON.stringify(optionConfig))
      );
    }
  }
}
