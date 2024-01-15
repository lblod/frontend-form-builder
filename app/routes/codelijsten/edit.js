import Route from '@ember/routing/route';
import { service } from '@ember/service';

export default class CodelijstenEditRoute extends Route {
  @service store;

  constructor() {
    super(...arguments);
  }

  async model(params) {
    const conceptScheme = await this.getConceptSchemeById(params.id);

    return {
      conceptScheme: conceptScheme,
      concepts: await conceptScheme.concepts,
    };
  }

  setupController(controller, model) {
    super.setupController(...arguments);

    controller.setup(model);
  }

  async getConceptSchemeById(conceptSchemeId) {
    try {
      const conceptScheme = await this.store.findRecord(
        'concept-scheme',
        conceptSchemeId,
        {
          include: 'concepts',
        }
      );
      await conceptScheme.reload();

      return conceptScheme;
    } catch (error) {
      throw `Could not fetch concept-scheme with id: ${conceptSchemeId}`;
    }
  }
}
