import Route from '@ember/routing/route';

import { service } from '@ember/service';

export default class CodelijstenRoute extends Route {
  @service store;

  async model() {
    const conceptSchemes = await this.store.query('concept-scheme', {});

    return conceptSchemes;
  }
}
