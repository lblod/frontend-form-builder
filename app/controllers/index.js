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

  @tracked showDeleteModal = false;
  @service store;
  @service router;

  @tracked showModal = false;
  @tracked hasBeenFocused = false;
  @tracked name = '';
  @tracked description = ``;
  @tracked nameCheck = [];

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
    this.nameCheck = await this.store.query('generated-form', {
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

  get errorEmptyName() {
    if (this.hasBeenFocused) {
      return this.name == '';
    } else {
      return false;
    }
  }

  get errorDuplicateName() {
    if (this.hasBeenFocused) {
      if (this.nameCheck.length > 0) {
        return true;
      }
      return false;
    } else {
      return false;
    }
  }

  get errorInput() {
    return this.errorEmptyName || this.errorDuplicateName;
  }

  get disableSubmit() {
    return (
      this.errorEmptyName || this.errorDuplicateName || !this.hasBeenFocused
    );
  }
}
