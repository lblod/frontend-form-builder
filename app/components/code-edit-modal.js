import Component from '@glimmer/component';
import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';
import { restartableTask, timeout } from 'ember-concurrency';

export default class CodeEditModal extends Component {
  @tracked formCode;
  @tracked formCodeUpdates;
  @tracked isButtonsDisabled;

  constructor() {
    super(...arguments);
    this.formCode = this.args.code;
    this.isButtonsDisabled = true;
  }

  handleCodeChange = restartableTask(async (newCode) => {
    if (newCode == this.formCode) {
      this.isButtonsDisabled = true;
      this.formCode = this.formCodeUpdates;

      return;
    }
    this.formCodeUpdates = newCode;
    this.isButtonsDisabled = false;
  });

  @action
  restoreForm() {
    this.isButtonsDisabled = true;
    this.formCode = this.args.code;
  }

  @action
  updateForm() {
    this.isButtonsDisabled = true;
    this.formCode = this.formCodeUpdates;
    console.log(`update code to `, this.formCode);
    this.args.onCodeChange?.(this.formCode);
    this.args.onClose(true);
  }
}
