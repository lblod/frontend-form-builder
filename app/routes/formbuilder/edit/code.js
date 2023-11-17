import Route from '@ember/routing/route';

export default class FormbuilderEditCodeRoute extends Route {
  async model() {
    const editRoute = this.modelFor('formbuilder.edit');
    /* eslint ember/no-controller-access-in-routes: "warn" */
    const editController = this.controllerFor('formbuilder.edit');

    return {
      graphs: editRoute.graphs,
      handleCodeChange: editController.handleCodeChange,
    };
  }

  setupController(controller) {
    super.setupController(...arguments);

    controller.setup();
  }
}
