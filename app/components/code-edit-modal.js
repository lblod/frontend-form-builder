import Component from '@glimmer/component';
import { action } from '@ember/object';
import { inject as service } from '@ember/service';
import { tracked } from '@glimmer/tracking';
import { restartableTask } from 'ember-concurrency';

export default class CodeEditModal extends Component {
  @service('form-code-manager') formCodeManager;

  @tracked formCode;
  @tracked isButtonsDisabled;

  constructor() {
    super(...arguments);
    this.formCode = this.formCodeManager.getTtlOfLatestVersion();
    this.updateButtonDisabledState();
  }

  willDestroy() {
    super.willDestroy(...arguments);

    this.args.onCodeChange?.(this.formCode);
  }

  handleCodeChange = restartableTask(async (newCode) => {
    this.formCodeManager.addFormCode(newCode);
    this.updateButtonDisabledState();
  });

  @action
  restoreForm() {
    this.formCode = this.formCodeManager.getTtlOfReferenceVersion();
    this.formCodeManager.addFormCode(this.formCode);
    this.updateButtonDisabledState();
  }

  @action
  updateForm() {
    this.formCode = this.formCodeManager.getTtlOfLatestVersion();

    this.args.onCodeChange?.(this.formCode);
    this.updateButtonDisabledState();
  }

  updateButtonDisabledState() {
    this.isButtonsDisabled =
      !this.formCodeManager.isLatestDeviatingFromReference();
  }
}
