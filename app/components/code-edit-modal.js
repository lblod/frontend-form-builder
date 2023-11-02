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
    this.isButtonsDisabled = true;
  }

  handleCodeChange = restartableTask(async (newCode) => {
    this.formCodeManager.addFormCode(newCode);

    this.isButtonsDisabled =
      !this.formCodeManager.isLatestDeviatingFromReference();
  });

  @action
  restoreForm() {
    this.isButtonsDisabled = true;
    this.formCode = this.formCodeManager.getTtlOfVersion(
      this.formCodeManager.getReferenceVersion()
    );
  }

  @action
  updateForm() {
    this.isButtonsDisabled = true;
    this.formCode = this.formCodeManager.getTtlOfLatestVersion();
    this.formCodeManager.pinLatestVersionAsReferenceTtl();

    this.args.onCodeChange?.(this.formCode);
  }
}
