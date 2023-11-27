import { action } from '@ember/object';
import { guidFor } from '@ember/object/internals';
import { tracked } from '@glimmer/tracking';
import InputFieldComponent from '@lblod/ember-submission-form-fields/components/rdf-input-fields/input-field';
import { SKOS, updateSimpleFormValue } from '@lblod/submission-form-helpers';
import { Statement, namedNode } from 'rdflib';
import { FORM } from '../../utils/rdflib';
import { getPrefLabelOfNode } from '../../utils/forking-store-helpers';

function byLabel(a, b) {
  const textA = a.label.toUpperCase();
  const textB = b.label.toUpperCase();
  return textA < textB ? -1 : textA > textB ? 1 : 0;
}

export default class CountryCodeConceptSchemeSelectorComponent extends InputFieldComponent {
  inputId = 'select-' + guidFor(this);

  @tracked selectedCountryCode = null;
  @tracked countryCodeOptions = [];
  @tracked searchEnabled = true;

  constructor() {
    super(...arguments);
    this.loadOptions();
    this.loadSelectedCountryCodeOption();
  }

  loadOptions() {
    const metaGraph = this.args.graphs.metaGraph;
    const fieldOptions = this.args.field.options;
    const conceptScheme = new namedNode(fieldOptions.conceptScheme);

    if (fieldOptions.searchEnabled !== undefined) {
      this.searchEnabled = fieldOptions.searchEnabled;
    }

    this.countryCodeOptions = this.args.formStore
      .match(undefined, SKOS('inScheme'), conceptScheme, metaGraph)
      .map((t) => {
        const label = getPrefLabelOfNode(
          t.subject,
          this.args.formStore,
          metaGraph
        );

        return { subject: t.subject, label: label && label.value };
      });
    this.countryCodeOptions.sort(byLabel);
  }

  loadSelectedCountryCodeOption() {
    const selectedDefaultCountry = this.storeOptions.store.any(
      this.storeOptions.sourceNode,
      FORM('defaultCountry'),
      undefined,
      this.storeOptions.sourceGraph
    );

    if (selectedDefaultCountry) {
      this.selectedCountryCode = this.countryCodeOptions.find(
        (opt) => selectedDefaultCountry.value == opt.label
      );
    }
  }

  @action
  updateCountryCode(newCountryCodeOption) {
    this.selectedCountryCode = newCountryCodeOption;

    const currentDefaultCountries = this.storeOptions.store.match(
      this.storeOptions.sourceNode,
      FORM('defaultCountry'),
      undefined,
      this.storeOptions.sourceGraph
    );

    if (newCountryCodeOption) {
      updateSimpleFormValue(this.storeOptions, newCountryCodeOption.label);

      const oldCountryCodes = currentDefaultCountries.map((statement) => {
        return new Statement(
          this.storeOptions.sourceNode,
          FORM('defaultCountry'),
          statement.object.value,
          this.storeOptions.sourceGraph
        );
      });
      this.storeOptions.store.removeStatements(oldCountryCodes);
    }

    this.hasBeenFocused = true;
    super.updateValidations();
  }
}
