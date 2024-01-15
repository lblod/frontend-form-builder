import Route from '@ember/routing/route';

import { service } from '@ember/service';

export default class CodelijstenIndexRoute extends Route {
  @service store;

  async model() {
    const conceptSchemes = await this.store.query('concept-scheme', {
      sort: '-preflabel',
    });

    return conceptSchemes;
  }
}
