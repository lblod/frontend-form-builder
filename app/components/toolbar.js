import Component from '@glimmer/component';
import { inject as service } from '@ember/service';
import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';
import {
  DESCRIPTION_NOT_USED_PLACEHOLDER,
  NAME_INPUT_CHAR_LIMIT,
} from '../utils/constants';
import { downloadTextAsFile } from '../utils/download-text-as-file';

export default class ToolbarComponent extends Component {
  @service store;
  @service router;
  @service toaster;
  @service intl;
  @service('form-code-manager') formCodeManager;

  @tracked showDeleteModal = false;

  @tracked isEditingName = false;
  @tracked formLabel = this.args.model.label;

  @action
  saveLocally() {
    downloadTextAsFile(
      {
        filename: this.formLabel,
        contentAsText: this.args.code,
      },
      document,
      window
    );
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
      this.formCodeManager.reset();
      this.toaster.success(
        this.intl.t('messages.success.formDeleted', {
          name: this.formLabel,
        }),
        this.intl.t('messages.subjects.deleted'),
        {
          timeOut: 5000,
        }
      );
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
      this.toaster.success(
        this.intl.t('messages.success.formUpdated'),
        this.intl.t('messages.subjects.success'),
        {
          timeOut: 5000,
        }
      );
      this.formCodeManager.pinLatestVersionAsReference();
      this.isEditingName = false;
    } catch (err) {
      this.toaster.error(
        this.intl.t('messages.error.somethingWentWrong'),
        this.intl.t('messages.subjects.error'),
        {
          timeOut: 5000,
        }
      );
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
        this.intl.t('constraints.maxCharactersReachedWithCount', {
          count: this.formLabel.length,
          maxCount: NAME_INPUT_CHAR_LIMIT,
        }),
        this.intl.t('messages.subjects.characters'),
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
      this.toaster.error(
        this.intl.t('constraints.duplicateName'),
        this.intl.t('messages.subjects.error'),
        {
          timeOut: 5000,
        }
      );
      return;
    }

    this.isEditingName = false;
    await this.updateForm();

    return;
  }
}
