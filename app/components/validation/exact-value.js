import Component from '@glimmer/component';

import { guidFor } from '@ember/object/internals';
import { FORM } from '@lblod/submission-form-helpers';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import { Literal } from 'rdflib';

export default class ValidationExatValueComponent extends Component {
  inputId = 'validation-exact-value-' + guidFor(this);

  @tracked exactValue;

  constructor() {
    super(...arguments);

    if (this.args.validation.customValue) {
      this.exactValue = this.args.validation.customValue.object.value;
    }
  }

  @action
  updateExactValue(event) {
    if (!event.target) {
      this.exactValue = null;
    } else {
      this.exactValue = event.target.value;
    }

    let objectValue = null;

    if (this.exactValue && this.exactValue.trim() !== '') {
      objectValue = new Literal(this.exactValue);
    }

    this.args.update({
      customValue: { object: objectValue, predicate: FORM('customValue') },
    });
  }

  get isForValidationType() {
    if (!this.args.validation) {
      return false;
    }
    if (!this.args.validation.type) {
      return false;
    }

    return (
      this.args.validation.type.object.value ==
      FORM('ExactValueConstraint').value
    );
  }
}
