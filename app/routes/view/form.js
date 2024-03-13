import Route from '@ember/routing/route';

import {
  GRAPHS,
  PREVIEW_SOURCE_NODE,
} from '../../controllers/formbuilder/edit';
import { service } from '@ember/service';

export default class ViewFormRoute extends Route {
  @service store;

  async model(params) {
    const form = await this.store.findRecord('generated-form', params.id);

    return {
      form: {
        title: form.label,
        ttlCode: form.ttlCode,
      },
      graphs: GRAPHS,
      sourceNode: PREVIEW_SOURCE_NODE,
    };
  }

  setupController(controller) {
    super.setupController(...arguments);

    controller.setupForm.perform();
  }
}
