import Route from '@ember/routing/route';
import template from '../../util/basic-form-template';

export default class FormbuilderEditRoute extends Route {
  async model(params) {
    return await this.store.find('generated-form', params.id);
  }

  setupController(controller, model) {
    super.setupController(...arguments);
    controller.set('codeEditor', model.ttlCode ? model.ttlCode : template)
  }
}
