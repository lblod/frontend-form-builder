import Component from '@glimmer/component';
import { action } from '@ember/object';
import { inject as service } from '@ember/service';
import { tracked } from '@glimmer/tracking';
import { restartableTask } from 'ember-concurrency';

export default class CodeEditModal extends Component {
  @service('form-code-manager') formCodeManager;

  @tracked formCode;
  @tracked formCodeUpdates;
  @tracked isButtonsDisabled;

  constructor() {
    super(...arguments);
    this.formCode = this.formCodeManager.getTtlOfLatestVersion();
    this.formCodeUpdates = this.formCode;
    this.isButtonsDisabled = this.formCodeManager.isTtlTheSameAsLatest(
      this.formCode
    );
  }

  willDestroy() {
    super.willDestroy(...arguments);

    this.args.onCodeChange?.(this.formCodeManager.getTtlOfLatestVersion());
  }

  handleCodeChange = restartableTask(async (newCode) => {
    if (this.formCodeManager.isTtlTheSameAsLatest(newCode)) {
      this.isButtonsDisabled = true;

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
    this.formCode = this.formCodeManager.getTtlOfReferenceVersion();
    this.isButtonsDisabled = true;

    this.args.onCodeChange?.(this.formCode);
  }

  @action
  updateForm() {
    this.formCode = this.formCodeUpdates;
    this.formCodeManager.addFormCode(this.formCode);

    this.args.onCodeChange?.(this.formCode);
    this.isButtonsDisabled = true;
  }
}
