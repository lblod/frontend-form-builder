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
    };
  }

  async setupController(controller, model) {
    super.setupController(...arguments);

    await controller.setup(model);
  }

  async resetController(controller) {
    await controller.removeEmptyConceptsAndScheme();
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
