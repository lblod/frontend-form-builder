import Route from '@ember/routing/route';
import { service } from '@ember/service';

export default class CodelijstenEditRoute extends Route {
  @service store;

  constructor() {
    super(...arguments);
  }

  async model(params) {
    return {
      conceptSchemeId: params.id,
    };
  }

  async setupController(controller, model) {
    super.setupController(...arguments);

    controller.setup.perform(model.conceptSchemeId);
  }

  async resetController(controller) {
    await controller.removeEmptyConceptsAndScheme();
  }
}
