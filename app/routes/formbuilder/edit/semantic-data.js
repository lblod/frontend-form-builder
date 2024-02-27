import Route from '@ember/routing/route';

import { service } from '@ember/service';

export default class FormbuilderEditSemanticDataRoute extends Route {
  @service router;
  @service('form-code-manager') formCodeManager;

  async model() {
    try {
      const ttl = this.formCodeManager.getTtlOfLatestVersion();

      return {
        ttlCode: ttl,
      };
    } catch (error) {
      console.log(this.formCodeManager.getFormId());
      this.router.transitionTo(
        'formbuilder.edit',
        this.formCodeManager.getFormId()
      );
    }
  }

  setupController(controller, model) {
    super.setupController(...arguments);

    controller.setup(model);
  }
}
