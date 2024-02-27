import Route from '@ember/routing/route';

import { service } from '@ember/service';

export default class FormbuilderEditSemanticDataRoute extends Route {
  @service router;
  @service('form-code-manager') formCodeManager;

  async model() {
    try {
      const formTtl = this.formCodeManager.getTtlOfLatestVersion();
      const dataTtl = this.formCodeManager.getInputDataForLatestFormVersion();

      return {
        formTtlCode: formTtl,
        dataTtlCode: dataTtl,
      };
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
