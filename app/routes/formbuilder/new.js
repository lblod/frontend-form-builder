import Route from '@ember/routing/route';

import { GRAPHS } from '../../controllers/formbuilder/edit';

export default class FormbuilderNewRoute extends Route {
  model() {
    return {
      graphs: GRAPHS,
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
