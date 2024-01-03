import Route from '@ember/routing/route';

export default class FormbuilderConfigurationRoute extends Route {
  model() {
    const editRoute = this.modelFor('formbuilder.edit');

    return {
      graphs: editRoute.graphs,
    };
  }

  setupController(controller) {
    super.setupController(...arguments);

    controller.setup();
  }
}
