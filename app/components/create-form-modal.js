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
      this.toaster.success('Formulier succesvol aangemaakt', 'Success', {
        timeOut: 5000,
      });
    } catch (err) {
      this.toaster.error('Oeps, er is iets mis gegaan', 'Error', {
        timeOut: 5000,
      });
      console.error(err);
    }
    this.closeModal();
  }

  get inputErrorMessage() {
    if (this.name.trim() == '' && this.hasBeenFocused) {
      return 'Een naam geven is verplicht';
    }
    if (this.duplicateNames.length > 0) {
      return 'Deze naam is al eens gebruikt';
    }

    if (this.name.length > NAME_INPUT_CHAR_LIMIT) {
      return `Maximum characters exceeded`;
    }

    return false;
  }

  get getCharacters() {
    return `Remaing characters: ${NAME_INPUT_CHAR_LIMIT - this.name.length}`;
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
