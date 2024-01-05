import Component from '@glimmer/component';
import { service } from '@ember/service';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';

export default class CreateFormModal extends Component {
  @service store;
  @service router;
  @service toaster;

  @tracked name = '';
  @tracked description = ``;
  @tracked duplicateNames = [];

  hasBeenFocused = false;

  @action
  closeModal() {
    this.args.closeModal();
  }

  @action
  async handleNameChange(event) {
    this.name = event.target.value;
    this.duplicateNames = await this.store.query('generated-form', {
      filter: {
        ':exact:label': this.name.trim(),
      },
    });
    this.hasBeenFocused = true;
  }

  @action
  handleDescriptionChange(event) {
    this.description = event.target.value;
  }

  @action
  async initiateForm() {
    const now = new Date();

    const newForm = await this.store.createRecord('generated-form', {
      created: now,
      modified: now,
      label: this.name,
      comment: this.description,
      ttlCode: '',
    });

    try {
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
    return false;
  }

  get disableSubmit() {
    return (
      (this.name.trim() == '' && this.hasBeenFocused) ||
      this.duplicateNames.length > 0 ||
      !this.hasBeenFocused
    );
  }
}
