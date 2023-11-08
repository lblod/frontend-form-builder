import Route from '@ember/routing/route';

import { inject as service } from '@ember/service';

export default class FormbuilderEditValidationsRoute extends Route {
  @service('form-code-manager') formCodeManager;
  @service router;

  model() {
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
      handleCodeChange: editController.handleCodeChange,
    };
  }
}
