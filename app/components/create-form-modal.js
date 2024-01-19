import Component from '@glimmer/component';
import { service } from '@ember/service';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import {
  DESCRIPTION_NOT_USED_PLACEHOLDER,
  NAME_INPUT_CHAR_LIMIT,
} from '../utils/constants';
import { restartableTask } from 'ember-concurrency';

export default class CreateFormModal extends Component {
  @service store;
  @service router;
  @service toaster;
  @service intl;

  @tracked name = '';
  @tracked duplicateNames = [];
  @tracked hasBeenFocused = false;

  @action
  closeModal() {
    this.args.closeModal();
  }

  handleNameChange = restartableTask(async (event) => {
    this.name = event.target.value.trim();
    this.duplicateNames = await this.store.query('generated-form', {
      filter: {
        ':exact:label': this.name,
      },
    });
    this.hasBeenFocused = true;
  });

  @action
  async initiateForm() {
    const now = new Date();

    const newForm = await this.store.createRecord('generated-form', {
      created: now,
      modified: now,
      label: this.name,
      comment: DESCRIPTION_NOT_USED_PLACEHOLDER,
      ttlCode: '',
    });

    try {
      await newForm.save();
      await newForm.save();
      this.router.transitionTo('formbuilder.edit', newForm.id);
      this.toaster.success(
        this.intl.t('messages.success.formCreated'),
        this.intl.t('messages.subjects.success'),
        {
          timeOut: 5000,
        }
      );
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
    this.closeModal();
  }

  get inputErrorMessage() {
    if (this.name.trim() == '' && this.hasBeenFocused) {
      return this.intl.t('constraints.mandatoryField');
    }
    if (this.duplicateNames.length > 0) {
      return this.intl.t('constraints.duplicateName');
    }

    if (this.name.length > NAME_INPUT_CHAR_LIMIT) {
      return this.intl.t('constraints.maxCharactersReached');
    }

    return false;
  }

  get getCharacters() {
    return this.intl.t('messages.feedback.remainingCharacters', {
      currentCount: NAME_INPUT_CHAR_LIMIT - this.name.length,
    });
  }

  get disableSubmit() {
    return (
      (this.name.trim() == '' && this.hasBeenFocused) ||
      this.duplicateNames.length > 0 ||
      !this.hasBeenFocused ||
      this.name.length > NAME_INPUT_CHAR_LIMIT
    );
  }
}
