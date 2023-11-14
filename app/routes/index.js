/* eslint-disable ember/no-mixins */
import Route from '@ember/routing/route';
import DataTableRouteMixin from 'ember-data-table/mixins/route';
import { inject as service } from '@ember/service';

export default class IndexRoute extends Route.extend(DataTableRouteMixin) {
  @service store;

  modelName = 'generated-form';
}
