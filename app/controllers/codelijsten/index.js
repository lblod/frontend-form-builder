import Controller from '@ember/controller';
import { service } from '@ember/service';
import { action } from '@ember/object';

export default class CodelijstenController extends Controller {
  @service features;
  @service router;

  sort = '-preflabel';
  page = 0;
  size = 20;

  @action
  routeToFormWithId() {
    if (this.formId) {
      this.router.transitionTo('formbuilder.edit', this.formId);
    } else {
      this.router.transitionTo('index');
    }
  }
}
