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
        {
          label: 'Contactgegevens contactpersoon',
          path: '',
        },
        {
          label: 'Contactgegevens + bijlage',
          path: '',
        },
        {
          label: 'Simpele tabel',
          path: '',
        },
        {
          label: 'Uitgebreide tabel listing',
          path: '',
        },
      ],
    };
  }

  setupController(controller, model) {
    super.setupController(...arguments);

    controller.setup(model);
  }
}
