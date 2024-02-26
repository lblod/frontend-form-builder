import Route from '@ember/routing/route';
import { getLocalFileContentAsText } from '../../../utils/get-local-file-content';

export default class FormbuilderEditSemanticDataRoute extends Route {
  async model() {
    return {
      ttlCode: await getLocalFileContentAsText(
        '/forms/templates/contact-info-contact-person.ttl'
      ),
    };
  }

  setupController(controller, model) {
    super.setupController(...arguments);

    controller.setup(model);
  }
}
