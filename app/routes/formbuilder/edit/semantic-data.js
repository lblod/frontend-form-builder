import Route from '@ember/routing/route';

import { service } from '@ember/service';

export default class FormbuilderEditSemanticDataRoute extends Route {
  @service('form-code-manager') formCodeManager;

  async model() {
    return {
      ttlCode: this.formCodeManager.getTtlOfLatestVersion(),
    };
  }

  setupController(controller, model) {
    super.setupController(...arguments);

    controller.setup(model);
  }
}
