import Route from '@ember/routing/route';
import template from '../../utils/basic-form-template';
import { inject as service } from '@ember/service';

export default class FormbuilderEditRoute extends Route {
  @service store;

  async model(params) {
    return await this.store.findRecord('generated-form', params.id);
  }

  setupController(controller, model) {
    super.setupController(...arguments);
    controller.set('code', model.ttlCode ? model.ttlCode : template);
  }
}
