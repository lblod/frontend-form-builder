import Component from '@glimmer/component';

import { guidFor } from '@ember/object/internals';
import { FORM } from '@lblod/submission-form-helpers';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';

export default class ValidationResultMessageComponent extends Component {
  inputId = 'validation-max-length-' + guidFor(this);

  @tracked maxLength;

  constructor() {
    super(...arguments);

    if (this.args.validation.max) {
      this.maxLength = this.args.validation.max.object.value;
    }
  }

  @action
  updateMaxLength(event) {
    if (!event.target) {
      this.maxLength = 0;
    } else {
      this.maxLength = event.target.value;
    }

    this.args.update({
      subject: this.args.validation.subject,
      max: this.maxLength,
    });
  }

  get isForValidationType() {
    if (!this.args.validation) {
      return false;
    }
    if (!this.args.validation.type) {
      return false;
    }
    console.log(this.args.validation);

    return this.args.validation.type.object.value == FORM('MaxLength').value;
  }
}
