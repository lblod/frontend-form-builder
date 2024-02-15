import Controller from '@ember/controller';
import { service } from '@ember/service';
import { action } from '@ember/object';

export default class CodelijstenController extends Controller {
  @service features;
  @service('formbuilder-id-service') formbuilderIdService;
  @service router;
  @service store;

  formbuilderId;

  sort = '-preflabel';
  page = 0;
  size = 20;

  @action
  backToFormbuilder() {
    const formId = this.formbuilderIdService.getFormbuilderId();
    if (formId) {
      this.router.transitionTo('formbuilder.edit', formId);
      this.formbuilderIdService.clearFormbuilderId();
    } else {
      this.router.transitionTo('index');
    }
  }
}
