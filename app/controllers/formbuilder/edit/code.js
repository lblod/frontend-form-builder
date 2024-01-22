import Controller from '@ember/controller';

import { inject as service } from '@ember/service';
import { restartableTask } from 'ember-concurrency';
import { tracked } from '@glimmer/tracking';
import { ForkingStore } from '@lblod/ember-submission-form-fields';
import { cleanupTtlcode } from '../../../utils/clean-up-ttl/clean-up-ttl-code';

export default class FormbuilderEditCodeController extends Controller {
  @service('form-code-manager') formCodeManager;
  @service toaster;

  @tracked formCode;
  @tracked formCodeUpdates;

  setup() {
    const updatedFormCode = cleanupTtlcode(
      this.formCodeManager.getTtlOfLatestVersion(),
      this.toaster
    );

    this.formCode = updatedFormCode;
    this.formCodeUpdates = this.formCode;
    this.model.handleCodeChange(this.formCode);
  }

  handleCodeChange = restartableTask(async (newCode) => {
    if (this.formCodeManager.isTtlTheSameAsLatest(newCode)) {
      return;
    }
    const builderStore = new ForkingStore();
    try {
      builderStore.parse(
        newCode,
        this.model.graphs.sourceGraph.value,
        'text/turtle'
      );
    } catch (error) {
      console.warn({ caught: error });
      // This is limiting the errors thrown in the console while editing the code
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
