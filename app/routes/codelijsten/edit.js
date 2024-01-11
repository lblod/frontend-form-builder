import Route from '@ember/routing/route';
import { service } from '@ember/service';

export default class CodelijstenEditRoute extends Route {
  @service store;

  constructor() {
    super(...arguments);
  }

  async model(params) {
    return {
      conceptScheme: await this.getConceptSchemeById(params.id),
      concepts: await this.getConceptsOfConceptSchemeById(params.id),
      isGenericConceptScheme: true,
    };
  }

  setupController(controller, model) {
    super.setupController(...arguments);

    controller.setup(model);
  }

  async getConceptsOfConceptSchemeById(conceptSchemeId) {
    try {
      const concepts = await this.store.query('concept', {
        filter: {
          'concept-schemes': {
            ':id:': conceptSchemeId,
          },
        },
      });

      return concepts;
    } catch (error) {
      throw `Could not fetch concepts from concept-scheme with id: ${conceptSchemeId}`;
    }
  }
  async getConceptSchemeById(conceptSchemeId) {
    try {
      const conceptScheme = await this.store.findRecord(
        'concept-scheme',
        conceptSchemeId
      );

      return conceptScheme;
    } catch (error) {
      throw `Could not fetch concept-scheme with id: ${conceptSchemeId}`;
    }
  }
}
