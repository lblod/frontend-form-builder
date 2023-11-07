import Route from '@ember/routing/route';

export default class FormbuilderEditBuilderRoute extends Route {
  constructor() {
    super(...arguments);
  }

  async model() {
    const editRoute = this.modelFor('formbuilder.edit');

    return {
      formTtl: editRoute.formTtl,
      metaTtl: editRoute.metaTtl,
      graphs: editRoute.graphs,
    };
  }

  setupController(controller) {
    super.setupController(...arguments);

    controller.setup();
  }

  resetController(controller) {
    controller.deregisterFromObservable();
  }
}
