import Component from '@glimmer/component';

import { guidFor } from '@ember/object/internals';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import { SHACL } from '@lblod/submission-form-helpers';
import { Literal } from 'rdflib';

export default class ValidationResultMessageComponent extends Component {
  inputId = 'validation-result-message-' + guidFor(this);

  @tracked message;

  constructor() {
    super(...arguments);

    this.message = this.defaultResultMessage;
    if (this.args.validation.resultMessage) {
      const { resultMessage } = this.args.validation;
      this.message = resultMessage.object.value;
    } else {
      this.sendUpdateToParent();
    }
  }

  @action
  updateMessage(event) {
    const inputValue = event.target.value;

    if (!inputValue) {
      this.message = '';
    } else {
      this.message = inputValue.trim();
    }

    this.sendUpdateToParent();
  }

  @action
  resetMessageToDefault() {
    this.message = this.defaultResultMessage;
    this.sendUpdateToParent();
  }

  sendUpdateToParent() {
    this.args.update({
      resultMessage: {
        predicate: SHACL('resultMessage'),
        object: new Literal(this.message),
      },
    });
  }

  get hasErrors() {
    return false;
  }

  get defaultResultMessage() {
    return this.args.defaultMessage ?? '';
  }

  get messageIsDefaultMessage() {
    return this.message == this.defaultResultMessage;
  }

  get hasValidationType() {
    return this.args.validation && this.args.validation.type;
  }
}
