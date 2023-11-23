import Controller from '@ember/controller';
import { inject as service } from '@ember/service';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';

export default class IndexController extends Controller {
  sort = '-created';
  page = 0;
  size = 20;

  @service store;
  @tracked showModal = false;
  @tracked name = "";
  @tracked description = ``;

  modelName = 'generated-form';

  @action
  handleNameChange(event) {
    this.name = event.target.value;
  }

  @action
  handleCommentChange(event) {
    this.comment = event.target.value;
  }

  get emptyName() {
    return this.name == '';
  }
}
