import { action } from '@ember/object';
import { guidFor } from '@ember/object/internals';
import { tracked } from '@glimmer/tracking';
import InputFieldComponent from '@lblod/ember-submission-form-fields/components/rdf-input-fields/input-field';
import {
  RDF,
  SHACL,
  triplesForPath,
  updateSimpleFormValue,
} from '@lblod/submission-form-helpers';
import { namedNode } from 'rdflib';
import { sortObjectsOnProperty } from '../../utils/sort-object-on-property';

export default class SectionSelector extends InputFieldComponent {
  inputId = 'select-' + guidFor(this);

  @tracked selected = null;
  @tracked options = [];

  constructor() {
    super(...arguments);
    this.loadOptions();
    this.loadProvidedValue();
  }

  @action
  loadOptions() {
    const sourceGraph = this.args.graphs.sourceGraph;
    const section = new namedNode(
      'http://lblod.data.gift/vocabularies/forms/Section'
    );

    const allRawOptions = this.args.formStore
      .match(undefined, RDF('type'), section, sourceGraph)
      .map((t) => {
        const label = this.args.formStore.any(
          t.subject,
          SHACL('name'),
          undefined,
          sourceGraph
        );
        return { subject: t.subject, label: label && label.value };
      });

    // There are option labels that are undefined in this list, I did not found it yet why or where these values are added but if they do not have a label they should not be visible in the frontend
    const optionsWithALabel = allRawOptions.filter((option) => {
      return option.label;
    });

    this.options = sortObjectsOnProperty(optionsWithALabel, 'label');
  }

  loadProvidedValue() {
    if (this.isValid) {
      // Assumes valid input
      // This means even though we can have multiple values for one path (e.g. rdf:type)
      // this selector will only accept one value, and we take the first value from the matches.
      // The validation makes sure the matching value is the sole one.
      const matches = triplesForPath(this.storeOptions, true).values;
      this.selected = this.options.find((opt) =>
        matches.find((m) => m.equals(opt.subject))
      );
    }
  }

  @action
  updateSelection(option) {
    this.selected = option;

    // Cleanup old value(s) in the store
    const matches = triplesForPath(this.storeOptions, true).values;
    const matchingOptions = matches.filter((m) =>
      this.options.find((opt) => m.equals(opt.subject))
    );
    matchingOptions.forEach((m) =>
      updateSimpleFormValue(this.storeOptions, undefined, m)
    );

    // Insert new value in the store
    if (option) {
      updateSimpleFormValue(this.storeOptions, option.subject);
    }

    this.hasBeenFocused = true;
    super.updateValidations();
  }
}
