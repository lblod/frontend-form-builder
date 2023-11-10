import Route from '@ember/routing/route';

import { inject as service } from '@ember/service';

export default class FormbuilderEditCodeRoute extends Route {
  @service('form-code-manager') formCodeManager;
  @service router;

  constructor() {
    super(...arguments);
  }

  async model() {
    const editRoute = this.modelFor('formbuilder.edit');
    /* eslint ember/no-controller-access-in-routes: "warn" */
    const editController = this.controllerFor('formbuilder.edit');
    let ttlCode = null;

    try {
      ttlCode = this.formCodeManager.getTtlOfLatestVersion();
    } catch (error) {
      console.error(`Catched: ` + error);
      this.router.transitionTo('formbuilder.edit.builder');
    }

    return {
      formCode: ttlCode,
      graphs: editRoute.graphs,
      handleCodeChange: editController.handleCodeChange,
    };
  }

  setupController(controller) {
    super.setupController(...arguments);

    controller.setup();
  }
}
