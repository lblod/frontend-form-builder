import Controller from '@ember/controller';

import { inject as service } from '@ember/service';
import { restartableTask, timeout } from 'ember-concurrency';
import { tracked } from '@glimmer/tracking';
import { ForkingStore } from '@lblod/ember-submission-form-fields';
import { cleanupTtlcode } from '../../../utils/clean-up-ttl/clean-up-ttl-code';
import { shaclValidateTtlCode } from '../../../utils/SHACL/shacl-validate-ttl-code';
import { formatShaclValidationReport } from '../../../utils/SHACL/format-shacl-validation-report';
import { INPUT_DEBOUNCE_MS } from '../../../utils/constants';
import { action } from '@ember/object';

export default class FormbuilderEditCodeController extends Controller {
  @service('form-code-manager') formCodeManager;
  @service toaster;

  @tracked formCode;
  @tracked formCodeUpdates;
  @tracked collapsed = true;

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
    await timeout(INPUT_DEBOUNCE_MS);

    if (this.formCodeManager.isTtlTheSameAsLatest(newCode)) {
      return;
    }

    const shaclReport = await shaclValidateTtlCode(newCode);
    console.warn(
      'Formatted SHACL report: ',
      formatShaclValidationReport(shaclReport)
    );

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

  @action
  toggleCollapsed() {
    this.collapsed = !this.collapsed;
  }
}
