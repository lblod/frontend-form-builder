import Component from '@glimmer/component';
import { inject as service } from '@ember/service';
import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';
import {
  DESCRIPTION_NOT_USED_PLACEHOLDER,
  NAME_INPUT_CHAR_LIMIT,
} from '../utils/constants';

export default class ToolbarComponent extends Component {
  @service store;
  @service router;
  @service toaster;
  @service('form-code-manager') formCodeManager;

  @tracked showDeleteModal = false;

  @tracked isEditingName = false;
  @tracked formLabel = this.args.model.label;

  @action
  saveLocally() {
    // Create a link
    let downloadLink = document.createElement('a');
    downloadLink.download = this.formLabel;

    // generate Blob where file content will exists
    let blob = new Blob([this.args.code], { type: 'text/plain' });
    downloadLink.href = window.URL.createObjectURL(blob);

    // Click file to download then destroy link
    downloadLink.click();
    downloadLink.remove();
    this.isEditingName = false;
  }

  @action
  handleFormNameChange(event) {
    this.formLabel = event.target.value;
  }

  @action
  async deleteForm() {
    const generatedForm = this.args.model;
    const isDeleted = await generatedForm.destroyRecord();
    if (isDeleted) {
      this.router.transitionTo('index');
    }
  }

  @action
  async updateForm() {
    this.isEditingName = false;
    const form = await this.store.findRecord(
      'generated-form',
      this.args.model.id
    );
    form.modified = new Date();
    form.ttlCode = this.formCodeManager.getTtlOfLatestVersion();
    form.label = this.formLabel;
    form.comment = this.args.model.comment ?? DESCRIPTION_NOT_USED_PLACEHOLDER;

    try {
      await form.save();
      this.toaster.success('Formulier bijgewerkt', 'Success', {
        timeOut: 5000,
      });
      this.formCodeManager.pinLatestVersionAsReference();
      this.isEditingName = false;
    } catch (err) {
      this.toaster.error('Oeps, er is iets mis gegaan', 'Error', {
        timeOut: 5000,
      });
      console.error(err);
    }

    this.args.setFormChanged(false);
  }

  @action
  closeEditNameModal() {
    this.isEditingName = false;
    this.formLabel = this.args.model.label;
  }

  @action
  async updateFormName() {
    this.formLabel = this.formLabel.trim();

    if (this.formLabel.length > NAME_INPUT_CHAR_LIMIT) {
      this.toaster.warning(
        `Maxmim aantal toegelaten karakters is ${NAME_INPUT_CHAR_LIMIT}`,
        'Karakters',
        {
          timeOut: 5000,
        }
      );
      return;
    }

    const formsWithDuplicateName = await this.store.query('generated-form', {
      filter: {
        ':exact:label': this.formLabel,
      },
    });

    if (this.formLabel == this.args.model.label) {
      this.isEditingName = false;

      return;
    }

    if (formsWithDuplicateName.length >= 1) {
      this.toaster.error('Deze naam bestaat al', 'Error', {
        timeOut: 5000,
      });
      return;
    }

    this.isEditingName = false;
    await this.updateForm();

    return;
  }
}
