import Route from '@ember/routing/route';

/* eslint-disable ember/no-mixins */
import DataTableRouteMixin from 'ember-data-table/mixins/route';
import { service } from '@ember/service';

export default class CodelijstenRoute extends Route.extend(
  DataTableRouteMixin
) {
  @service store;

  modelName = 'concept-scheme';
}
