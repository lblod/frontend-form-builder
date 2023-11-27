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

  modelName = 'generated-form';

  get errorEmptyName() {
    if (this.hasBeenFocused){
      return this.name == '';
    } else {
      return false;
    }
  }

  get disableSubmit() {
    return this.name == '';
  }

  @action
  closeModal() {
    this.name = '';
    this.description = ``;
    this.showModal = false;
    this.hasBeenFocused = false;

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
    this.showModal = false;
    this.hasBeenFocused = false;
    this.name = '';
    this.description = ``;
  }
}
