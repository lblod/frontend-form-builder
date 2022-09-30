/* eslint-disable ember/no-mixins */
import Route from '@ember/routing/route';
import DataTableRouteMixin from 'ember-data-table/mixins/route';

export default class IndexRoute extends Route.extend(DataTableRouteMixin) {
  modelName = 'generated-form';
}
