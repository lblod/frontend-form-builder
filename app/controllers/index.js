import Controller from '@ember/controller';
import { inject as service } from '@ember/service';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';

export default class IndexController extends Controller {
  sort = '-created';
  page = 0;
  size = 20;

  @service store;
  @service router;

  @tracked showModal = false;
  @tracked hasBeenFocused = false;
  @tracked name = '';
  @tracked description = ``;
  @tracked nameCheck = [];

  modelName = 'generated-form';

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
