import Route from '@ember/routing/route';

export default class FormbuilderNewRoute extends Route {
  model() {
    return {
      templates: [
        {
          label: 'Basis template',
          path: '/forms/templates/basic-form-template.ttl',
        },
      ],
    };
  }

  setupController(controller, model) {
    super.setupController(...arguments);

    controller.setup(model);
  }
}
