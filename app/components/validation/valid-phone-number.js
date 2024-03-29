import Component from '@glimmer/component';

import { guidFor } from '@ember/object/internals';
import { FORM } from '@lblod/submission-form-helpers';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import { Literal } from 'rdflib';

export default class ValidationValidPhoneNumberComponent extends Component {
  inputId = 'validation-valid-phone-number-' + guidFor(this);

  @tracked countryCode;

  constructor() {
    super(...arguments);

    if (this.args.validation.countryCode) {
      this.countryCode = {
        label: this.args.validation.countryCode.object.value,
      };
    }
  }

  @action
  updateCountryCode(option) {
    this.countryCode = option;

    let objectValue = null;

    if (
      this.countryCode &&
      this.countryCode.label.trim() !== '' &&
      this.isCountryCodeFromOptions()
    ) {
      objectValue = new Literal(this.countryCode.label);
    }

    this.args.update({
      countryCode: {
        object: objectValue,
        predicate: FORM('defaultCountry'),
      },
    });
  }

  isCountryCodeFromOptions() {
    if (!this.countryCode || !this.countryCode.label) {
      return false;
    }

    const labelsOfOptions = this.codeOptions.map((option) => option.label);

    if (labelsOfOptions.includes(this.countryCode.label.trim())) {
      return true;
    }

    return false;
  }

  get codeOptions() {
    return this.args.countryCodeOptions ?? [];
  }

  get isForValidationType() {
    if (!this.args.validation) {
      return false;
    }
    if (!this.args.validation.type) {
      return false;
    }

    return (
      this.args.validation.type.object.value == FORM('ValidPhoneNumber').value
    );
  }
}
