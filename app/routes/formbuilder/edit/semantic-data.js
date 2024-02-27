import Route from '@ember/routing/route';

import { service } from '@ember/service';

export default class FormbuilderEditSemanticDataRoute extends Route {
  @service router;
  @service('form-code-manager') formCodeManager;

  async model() {
    try {
      this.formCodeManager.getTtlOfLatestVersion();
    } catch (error) {
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
