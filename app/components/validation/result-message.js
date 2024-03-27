import Component from '@glimmer/component';

import { guidFor } from '@ember/object/internals';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';

export default class ValidationResultMessageComponent extends Component {
  inputId = 'validation-result-message-' + guidFor(this);

  @tracked message;
  @tracked isUsingCustomMessage;

  constructor() {
    super(...arguments);

    this.message = '';
    if (this.args.validationConfig.resultMessage) {
      const { resultMessage } = this.args.validationConfig;
      this.message = resultMessage.object.value;
    }
  }

  @action
  setIsUsingCustomMessage(state) {
    this.isUsingCustomMessage = state;

    if (this.isUsingCustomMessage) {
      this.message = '';

      return;
    }

    this.message = this.defaultResultMessage;
    this.sendUpdateToParent();
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

  sendUpdateToParent() {
    let previousObject = null;

    if (this.args.validationConfig.resultMessage) {
      previousObject = this.args.validationConfig.resultMessage.object;
    }

    this.args.update({
      resultMessage: {
        subject: this.args.validationConfig.subject,
        message: this.message,
        previousObject: previousObject,
      },
    });
  }

  get hasErrors() {
    return false;
  }

  get defaultResultMessage() {
    return this.args.defaultMessage ?? '';
  }
}
