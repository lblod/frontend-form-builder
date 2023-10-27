import Component from '@glimmer/component';
import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';
import { restartableTask } from 'ember-concurrency';

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
    // The newCode is not assigned to this.fromCode as than the editor
    // loses focus as you are udpating the content in the editor.
    // Keeping the changes in another variable and at the end assigning
    // the formCode to the updated code
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

    this.args.onCodeChange?.(this.formCode);
    this.args.onClose(true);
  }
}
