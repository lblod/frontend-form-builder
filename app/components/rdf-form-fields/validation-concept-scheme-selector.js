import { action } from '@ember/object';
import { guidFor } from '@ember/object/internals';
import { inject as service } from '@ember/service';
import { tracked } from '@glimmer/tracking';
import InputFieldComponent from '@lblod/ember-submission-form-fields/components/rdf-input-fields/input-field';
import {
  SKOS,
  triplesForPath,
  updateSimpleFormValue,
} from '@lblod/submission-form-helpers';
import { namedNode } from 'rdflib';
import {
  getFirstFieldSubject,
  getPossibleValidationsForDisplayType,
} from '../../utils/validation-helpers';
import {
  getDisplayTypeOfNode,
  getRdfTypeOfNode,
  getValidationSubjectsOnNode,
} from '../../utils/forking-store-helpers';
import { showErrorToasterMessage } from '../../utils/toaster-message-helper';

function byLabel(a, b) {
  const textA = a.label.toUpperCase();
  const textB = b.label.toUpperCase();
  return textA < textB ? -1 : textA > textB ? 1 : 0;
}

export default class ValidationConceptSchemeSelectorComponent extends InputFieldComponent {
  inputId = 'select-' + guidFor(this);

  @tracked selected = null;
  @tracked options = [];
  @tracked searchEnabled = true;

  @service toaster;

  constructor() {
    super(...arguments);
    this.loadOptions();
    this.loadProvidedValue();
  }

  loadOptions() {
    const fieldSubject = getFirstFieldSubject(this.args.formStore);

    const fieldDisplayType = getDisplayTypeOfNode(
      fieldSubject,
      this.args.formStore,
      this.args.graphs.sourceBuilderGraph
    );

    const metaGraph = this.args.graphs.metaGraph;
    const fieldOptions = this.args.field.options;
    const conceptScheme = new namedNode(fieldOptions.conceptScheme);

    if (fieldOptions.searchEnabled !== undefined) {
      this.searchEnabled = fieldOptions.searchEnabled;
    }
    const conceptOptions = getPossibleValidationsForDisplayType(
      fieldDisplayType,
      this.args.formStore,
      this.args.graphs.fieldGraph
    );

    const allOptions = this.args.formStore
      .match(undefined, SKOS('inScheme'), conceptScheme, metaGraph)
      .map((t) => {
        const label = this.args.formStore.any(
          t.subject,
          SKOS('prefLabel'),
          undefined,
          metaGraph
        );
        return { subject: t.subject, label: label && label.value };
      });

    this.options = allOptions.filter((option) => {
      return conceptOptions
        .map((concept) => concept.value)
        .includes(option.subject.value);
    });
    this.options.sort(byLabel);
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

  isSelectedValidationAlreadyOnField(selectedOption) {
    const fieldSubject = getFirstFieldSubject(this.args.formStore);
    const validationNodes = getValidationSubjectsOnNode(
      fieldSubject,
      this.args.formStore,
      this.args.graphs.sourceGraph
    );

    for (const validationNode of validationNodes) {
      const type = getRdfTypeOfNode(
        validationNode,
        this.args.formStore,
        this.args.graphs.sourceGraph
      );

      if (type.value == selectedOption.subject.value) {
        return true;
      }
    }

    return false;
  }

  @action
  updateSelection(option) {
    this.selected = option;

    if (this.isSelectedValidationAlreadyOnField(this.selected)) {
      showErrorToasterMessage(
        this.toaster,
        `Validatie "${this.selected.label}" is duplicaat.`
      );
      this.selected = null;

      return;
    }

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
