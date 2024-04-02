import Component from '@glimmer/component';

import { guidFor } from '@ember/object/internals';
import { FORM } from '@lblod/submission-form-helpers';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import { Literal } from 'rdflib';

export default class ValidationResultMessageComponent extends Component {
  inputId = 'validation-max-length-' + guidFor(this);

  @tracked maxLength;

  minCharacters = 0;

  constructor() {
    super(...arguments);

    if (this.args.validation.max) {
      this.maxLength = this.args.validation.max.object.value;
    }
  }

  @action
  updateMaxLength(event) {
    if (!event.target) {
      this.maxLength = null;
    } else {
      this.maxLength = event.target.value;
    }

    if (this.isMaxLengthInputNotValid) {
      return;
    }

    let objectValue = null;

    if (this.maxLength && this.maxLength.trim() !== '') {
      objectValue = new Literal(this.maxLength);
    }

    this.args.update({
      max: { object: objectValue, predicate: FORM('max') },
    });
  }

  get isMaxLengthInputNotValid() {
    if (!this.maxLength || this.maxLength == '') {
      return true;
    }

    if (this.maxLength && parseInt(this.maxLength) <= this.minCharacters) {
      return true;
    }

    return false;
  }

  get isForValidationType() {
    if (!this.args.validation) {
      return false;
    }
    if (!this.args.validation.type) {
      return false;
    }

    return this.args.validation.type.object.value == FORM('MaxLength').value;
  }
}
