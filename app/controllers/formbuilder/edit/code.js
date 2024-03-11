import Controller from '@ember/controller';

import { service } from '@ember/service';
import { A } from '@ember/array';
import { restartableTask, timeout } from 'ember-concurrency';
import { tracked } from '@glimmer/tracking';
import { ForkingStore } from '@lblod/ember-submission-form-fields';
import { cleanupTtlcode } from '../../../utils/clean-up-ttl/clean-up-ttl-code';
import { shaclValidateTtlCode } from '../../../utils/SHACL/shacl-validate-ttl-code';
import { formatShaclValidationReport } from '../../../utils/SHACL/format-shacl-validation-report';
import {
  INPUT_DEBOUNCE_MS,
  SHACL_SEVERITY_TYPE,
} from '../../../utils/constants';
import { action } from '@ember/object';
import { showErrorToasterMessage } from '../../../utils/toaster-message-helper';

export default class FormbuilderEditCodeController extends Controller {
  @service('form-code-manager') formCodeManager;
  @service toaster;
  @service features;
  @service intl;

  @tracked formCode;
  @tracked formCodeUpdates;
  @tracked consoleClosed = true;
  @tracked consoleMessages = A([]);

  setup() {
    const updatedFormCode = cleanupTtlcode(
      this.formCodeManager.getTtlOfLatestVersion(),
      this.toaster
    );

    this.formCode = updatedFormCode;
    this.formCodeUpdates = this.formCode;
    this.model.handleCodeChange(this.formCode);
    this.consoleValidateCode(this.formCode);
  }

  handleCodeChange = restartableTask(async (newCode) => {
    await timeout(INPUT_DEBOUNCE_MS);

    await this.consoleValidateCode(newCode);

    // The newCode is not assigned to this.fromCode as than the editor
    // loses focus as you are updating the content in the editor.
    // Keeping the changes in another variable and at the end assigning
    // the formCode to the updated code
    this.formCodeUpdates = newCode;
    if (this.ttlHasErrors()) {
      this.consoleMessages.pushObject({
        severity: this.getConsoleSeverity(SHACL_SEVERITY_TYPE.info),
        subject: this.intl.t('messages.subjects.preview'),
        content: this.intl.t(
          'messages.feedback.previewNotUpdatedBecauseOfErrorsInTtl'
        ),
      });
      return;
    }

    if (this.formCodeManager.isTtlTheSameAsLatest(newCode)) {
      return;
    }

    this.model.handleCodeChange(this.formCodeUpdates);
  });

  @action
  toggleOpenCloseConsoleState() {
    this.consoleClosed = !this.consoleClosed;
  }

  async consoleValidateCode(newCode) {
    const shaclReport = await shaclValidateTtlCode(newCode);
    this.consoleMessages = A([]);

    const formattedReport = formatShaclValidationReport(shaclReport);
    console.warn('Formatted SHACL report: ', formattedReport);

    formattedReport.errorDetails.forEach((error) => {
      this.consoleMessages.pushObject({
        severity: this.getConsoleSeverity(error.severity),
        subject: error.subject,
        content: error.messages,
      });
    });

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
  }

  getConsoleSeverity(severity) {
    const baseClass = 'code-edit-message ';
    const mapping = {
      [SHACL_SEVERITY_TYPE.error]: {
        type: SHACL_SEVERITY_TYPE.error,
        icon: 'cross',
        class: baseClass + 'code-edit-message--bg-error',
        iconClass: 'code-edit-message--icon-error',
      },
      [SHACL_SEVERITY_TYPE.warning]: {
        type: SHACL_SEVERITY_TYPE.warning,
        icon: 'alert-triangle',
        class: baseClass + 'code-edit-message--bg-warning',
        iconClass: 'code-edit-message--icon-warning',
      },
      [SHACL_SEVERITY_TYPE.info]: {
        type: SHACL_SEVERITY_TYPE.info,
        icon: 'info-circle',
        class: baseClass + 'code-edit-message--bg-info',
        iconClass: 'code-edit-message--icon-info',
      },
    };

    if (!mapping[severity]) {
      showErrorToasterMessage(
        this.toaster,
        this.intl.t('messages.error.unknownShaclSeverityType', {
          severityType: severity,
        })
      );

      return mapping[SHACL_SEVERITY_TYPE.error];
    }

    return mapping[severity];
  }

  ttlHasErrors() {
    return (
      this.consoleMessages.filter(
        (message) => message.severity.type == SHACL_SEVERITY_TYPE.error
      ).length >= 1
    );
  }
}
