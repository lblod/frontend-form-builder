import Component from '@glimmer/component';

import { guidFor } from '@ember/object/internals';
import { FORM } from '@lblod/submission-form-helpers';

export default class ValidationResultMessageComponent extends Component {
  inputId = 'validation-max-length-' + guidFor(this);

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
