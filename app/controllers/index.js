import Controller from '@ember/controller';
import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';
import { service } from '@ember/service';

export default class IndexController extends Controller {
  @service store;
  @service toaster;

  sort = '-created';
  page = 0;
  size = 20;

  formToDelete;
  hasBeenFocused = false;

  @tracked showDeleteModal = false;
  @service store;
  @service router;

  @tracked showModal = false;
  @tracked name = '';
  @tracked description = ``;
  @tracked duplicateNames = [];

  @action
  openDeleteModal(generatedForm) {
    this.formToDelete = generatedForm;
    this.showDeleteModal = true;
  }

  @action
  async deleteForm() {
    try {
      await this.formToDelete.destroyRecord();
      this.toaster.success(
        'Formulier: ' + this.formToDelete.label + ' verwijderd',
        'Success',
        {
          timeOut: 5000,
        }
      );
      this.showDeleteModal = false;
    } catch (err) {
      this.toaster.error('Oeps, er is iets mis gegaan', 'Error', {
        timeOut: 5000,
      });
      console.error(err);
    }
  }


  @action
  closeModal() {
    this.name = '';
    this.description = ``;
    this.showModal = false;
    this.hasBeenFocused = false;
  }

  @action
  async handleNameChange(event) {
    this.name = event.target.value;
    this.duplicateNames = await this.store.query('generated-form', {
      filter: {
        ':exact:label': this.name,
      },
    });
    this.hasBeenFocused = true;
  }

  @action
  handleDescriptionChange(event) {
    this.description = event.target.value;
  }

  @action
  initiateForm() {
    this.router.transitionTo('formbuilder.new', {
      queryParams: {
        label: this.name,
        comment: this.description,
      },
    });
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
