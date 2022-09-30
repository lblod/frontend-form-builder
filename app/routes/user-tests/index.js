import Route from '@ember/routing/route';
import DataTableRouteMixin from 'ember-data-table/mixins/route';

export default class UserTestIndexRoute extends Route.extend(
  DataTableRouteMixin
) {
  modelName = 'user-test';
}
