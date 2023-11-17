import Controller from '@ember/controller';

import { action } from '@ember/object';
import { inject as service } from '@ember/service';
import { tracked } from '@glimmer/tracking';

export default class FormbuilderEditValidationsController extends Controller {
  @service('form-code-manager') formCodeManager;

  @tracked formCode;

  @action
  handleCodeChange(ttlCode) {
    this.formCodeManager.addFormCode(ttlCode);
    this.model.handleCodeChange(ttlCode);
  }

  setup() {
    this.formCode = this.formCodeManager.getTtlOfLatestVersion();
    this.model.handleCodeChange(this.formCode);
  }
}
