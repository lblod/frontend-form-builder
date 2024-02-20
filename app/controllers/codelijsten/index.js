import Controller from '@ember/controller';
import { service } from '@ember/service';
import { action } from '@ember/object';

export default class CodelijstenController extends Controller {
  @service features;
  @service router;
  @service intl;

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

  get routeLabel() {
    if (this.formId) {
      return this.intl.t('navigation.backToForm');
    } else {
      return this.intl.t('navigation.backToFormOverview');
    }
  }
}
