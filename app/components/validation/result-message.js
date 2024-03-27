import Component from '@glimmer/component';

import { guidFor } from '@ember/object/internals';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';

export default class ValidationResultMessageComponent extends Component {
  inputId = 'validation-result-message-' + guidFor(this);

  @tracked message;

  constructor() {
    super(...arguments);

    this.message = this.defaultResultMessage;

    if (this.args.validationConfig.resultMessage) {
      const { resultMessage } = this.args.validationConfig;
      this.message = resultMessage.object.value;
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
        subject: this.args.validationConfig.subject,
        message: this.message,
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

  get isUpdatingResultMessages() {
    return this.args.isUpdating;
  }
}
