import Controller from '@ember/controller';

import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';
import { service } from '@ember/service';
import { sortObjectsOnProperty } from '../../utils/sort-object-on-property';
import basicFormTemplate from '../../utils/ttl-templates/basic-form-template';

export default class FormbuilderEditorController extends Controller {
  @service('form-code-manager') formCodeManager;
  @service('form-version') formVersionManager;

  @tracked formCode;
  @tracked formVersion;

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
      this.formVersion = this.formVersionManager.getVersionForTtl(
        this.formCode
      );
      console.info(`Current version of form:`, this.formVersion);
    }
    this.setFormChanged(this.formCodeManager.isLatestDeviatingFromReference());
    console.log(`Editor | Building view | Handled code change`);
  }

  setup(model) {
    this.formCode = this.getFormTtlCode(model.generatedForm);
  }

  getFormTtlCode(generatedForm) {
    if (!generatedForm.ttlCode || generatedForm.ttlCode == '') {
      return basicFormTemplate;
    }

    return generatedForm.ttlCode;
  }

  get sortedBasicElements() {
    return sortObjectsOnProperty(this.basicElements, 'order');
  }

  get basicElements() {
    return [
      {
        label: 'Sectie',
        order: 1,
      },
      {
        label: 'Veld',
        order: 2,
      },
      {
        label: 'Listing',
        order: 3,
      },
      {
        label: 'Tabel',
        order: 4,
      },
    ];
  }
}
