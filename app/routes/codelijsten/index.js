import Route from '@ember/routing/route';

import { service } from '@ember/service';
// eslint-disable-next-line ember/no-mixins
import DataTableRouteMixin from 'ember-data-table/mixins/route';

export default class CodelijstenIndexRoute extends Route.extend(
  DataTableRouteMixin
) {
  @service store;

  queryParams = {
    formId: {
      refreshModel: true,
    },
  };

  modelName = 'concept-scheme';
}
