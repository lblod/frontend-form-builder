import Controller from '@ember/controller';

import { inject as service } from '@ember/service';
import { restartableTask } from 'ember-concurrency';
import { tracked } from '@glimmer/tracking';

export default class FormbuilderEditCodeController extends Controller {
  @service('form-code-manager') formCodeManager;

  @tracked formCode;
  @tracked formCodeUpdates;

  setup() {
    this.formCode = this.formCodeManager.getTtlOfLatestVersion();
    this.formCodeUpdates = this.formCode;
    this.model.handleCodeChange(this.formCode);
  }

  handleCodeChange = restartableTask(async (newCode) => {
    if (this.formCodeManager.isTtlTheSameAsLatest(newCode)) {
      return;
    }

    // The newCode is not assigned to this.fromCode as than the editor
    // loses focus as you are udpating the content in the editor.
    // Keeping the changes in another variable and at the end assigning
    // the formCode to the updated code
    this.formCodeUpdates = newCode;
    this.model.handleCodeChange(this.formCodeUpdates);
  });
}
