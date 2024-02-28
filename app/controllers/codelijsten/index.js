import Controller from '@ember/controller';
import { service } from '@ember/service';
import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';

export default class CodelijstenController extends Controller {
  @service features;
  @service router;
  @service intl;

  @tracked searchValue;

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

  @action
  searchCodelist(event) {
    const inputvalue = event.target.value;
    if (!inputvalue) {
      this.searchValue = null;

      return;
    }
    this.searchValue = inputvalue;
  }

  get routeLabel() {
    if (this.formId) {
      return this.intl.t('navigation.backToForm');
    } else {
      return this.intl.t('navigation.backToFormOverview');
    }
  }
}
