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

    console.log(`config`, this.args.validationConfig);

    this.message = '';
    if (this.args.validationConfig.resultMessage) {
      const { resultMessage } = this.args.validationConfig;
      this.message = resultMessage.object.value;
    }
  }

  @action
  setIsUsingCustomMessage(state) {
    this.isUsingCustomMessage = state;
  }

  @action
  updateMessage(event) {
    const inputValue = event.target.value;

    if (!inputValue) {
      this.message = '';
    } else {
      this.message = inputValue.trim();
    }
  }

  get hasErrors() {
    return false;
  }
}
