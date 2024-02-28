import Controller from '@ember/controller';
import { service } from '@ember/service';
import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';
// eslint-disable-next-line ember/no-mixins
import DefaultQueryParamsMixin from 'ember-data-table/mixins/default-query-params';

export default class CodelijstenController extends Controller.extend(
  DefaultQueryParamsMixin
) {
  @service features;
  @service router;
  @service intl;

  @tracked filter;

  sort = '-preflabel';
  size = 20;

  @action
  mergeQueryOptions(params) {
    console.log('params', params);
    return { included: 'author' };
  }

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

    this.filter = inputvalue;
  }

  get routeLabel() {
    if (this.formId) {
      return this.intl.t('navigation.backToForm');
    } else {
      return this.intl.t('navigation.backToFormOverview');
    }
  }
}
