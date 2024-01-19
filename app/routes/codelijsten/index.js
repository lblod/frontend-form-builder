import Route from '@ember/routing/route';

import { service } from '@ember/service';
import { PAGE_SIZE_TO_GET_ALL } from '../../utils/constants';

export default class CodelijstenIndexRoute extends Route {
  @service store;

  async model() {
    const conceptSchemes = await this.store.query('concept-scheme', {
      sort: '-preflabel',
      page: {
        size: PAGE_SIZE_TO_GET_ALL,
      },
    });

    return conceptSchemes;
  }
}
