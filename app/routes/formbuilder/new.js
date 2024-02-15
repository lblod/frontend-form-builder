import Route from '@ember/routing/route';

import { GRAPHS } from '../../controllers/formbuilder/edit';

export default class FormbuilderNewRoute extends Route {
  model() {
    return {
      graphs: GRAPHS,
      templates: [
        {
          label: 'Basis template',
          path: '/forms/templates/basic-form.ttl',
        },
        {
          label: 'Contactgegevens contactpersoon',
          path: '/forms/templates/contact-info-contact-person.ttl',
        },
        {
          label: 'Contactgegevens + bijlage',
          path: '/forms/templates/contact-info-contact-person-with-file.ttl',
        },
        {
          label: 'Simpele tabel',
          path: '/forms/templates/basic-table.ttl',
        },
      ],
    };
  }

  setupController(controller, model) {
    super.setupController(...arguments);

    controller.setup(model);
  }
}
