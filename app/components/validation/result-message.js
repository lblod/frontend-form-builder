import Component from '@glimmer/component';

import { guidFor } from '@ember/object/internals';
import { tracked } from '@glimmer/tracking';

export default class ValidationResultMessageComponent extends Component {
  inputId = 'validation-result-message-' + guidFor(this);

  @tracked message;

  constructor() {
    super(...arguments);

    this.message = '';
    console.log(`config`, this.args.validationConfig);
    if (this.args.validationConfig.resultMessage) {
      const { resultMessage } = this.args.validationConfig;
      this.message = resultMessage.object.value;
    }
  }
}
