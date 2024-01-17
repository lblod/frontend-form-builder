/* eslint-disable ember/no-mixins */
import Route from '@ember/routing/route';
import DataTableRouteMixin from 'ember-data-table/mixins/route';
import { service } from '@ember/service';

export default class IndexRoute extends Route.extend(DataTableRouteMixin) {
  @service store;
  @service('codelists') codelistsService;

  modelName = 'generated-form';

  async setupController() {
    super.setupController(...arguments);

    if (this.codelistsService.findTurtleText()) {
      await this.codelistsService.getLatest(this.store);
    }
  }
}
