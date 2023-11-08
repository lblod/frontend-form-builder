import Controller from '@ember/controller';

import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';
import { inject as service } from '@ember/service';
import { sym as RDFNode } from 'rdflib';
import basicFormTemplate from '../../utils/basic-form-template';

export const GRAPHS = {
  formGraph: new RDFNode('http://data.lblod.info/form'),
  metaGraph: new RDFNode('http://data.lblod.info/metagraph'),
  sourceGraph: new RDFNode(`http://data.lblod.info/sourcegraph`),
};

export default class FormbuilderEditController extends Controller {
  @service store;
  @service router;
  @service('form-code-manager') formCodeManager;

  @tracked formCode;

  @tracked formChanged;

  @action
  setFormChanged(value) {
    this.formChanged = value;
  }

  @action
  handleCodeChange(newCode) {
    if (newCode) {
      this.formCode = newCode;
      this.formCodeManager.addFormCode(this.formCode);
    }
    this.setFormChanged(this.formCodeManager.isLatestDeviatingFromReference());
  }

  setup(model) {
    this.formCode = this.getFormTtlCode(model.generatedForm);
    this.formCodeManager.addFormCode(this.formCode);
    this.formCodeManager.pinLatestVersionAsReference();
    this.router.transitionTo('formbuilder.edit.builder');
  }

  reset() {
    this.formCodeManager.clearHistory();
  }

  getFormTtlCode(generatedForm) {
    if (!generatedForm.ttlCode || generatedForm.ttlCode == '') {
      return basicFormTemplate;
    }

    return generatedForm.ttlCode;
  }
}
