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
  @tracked name = '';
  @tracked description = ``;

  modelName = 'generated-form';

  @action
  handleNameChange(event) {
    this.name = event.target.value;
  }

  @action
  handleDescriptionChange(event) {
    this.description = event.target.value;
  }

  get emptyName() {
    return this.name == '';
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
    this.name = '';
    this.description = ``;
  }
}
