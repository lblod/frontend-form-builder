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
  @tracked labels = [];

  modelName = 'generated-form';

  async fetchAllForms() {
    let forms = await this.store.findAll('generated-form');
    return forms;
  }

  @action
  openModal() {
    this.showModal = true;
    this.fetchAllForms().then((allForms) => {
      allForms.forEach((form) => {
        this.labels.addObject(form.label);
      });
    });
    console.log(this.labels);
  }

  @action
  closeModal() {
    this.name = '';
    this.description = ``;
    this.showModal = false;
    this.hasBeenFocused = false;
    this.labels = [];
  }

  @action
  handleNameChange(event) {
    this.name = event.target.value;
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
      for (const label of this.labels) {
        if (label === this.name) {
          return true;
        }
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
