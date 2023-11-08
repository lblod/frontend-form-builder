import Controller from '@ember/controller';

import { action } from '@ember/object';
import { inject as service } from '@ember/service';

export default class FormbuilderEditValidationsController extends Controller {
  @service('form-code-manager') formCodeManager;

  @action
  handleCodeChange(ttlCode) {
    this.formCodeManager.addFormCode(ttlCode);
    this.model.handleCodeChange();
  }
}
