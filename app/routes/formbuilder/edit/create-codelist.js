import Route from '@ember/routing/route';
import { getLocalFileContentAsText } from '../../../utils/get-local-file-content';
import { GRAPHS } from '../../../controllers/formbuilder/edit';
import basicCodelistTemplate from '../../../utils/basic-codelist-template';

export default class FormbuilderEditCreateCodelistRoute extends Route {
  async model() {
    const [formTtl] = await Promise.all([
      getLocalFileContentAsText('/forms/create-codelist/form.ttl'),
    ]);

    return {
      template: basicCodelistTemplate,
      formTtl: formTtl,
      graphs: GRAPHS,
    };
  }

  setupController(controller) {
    super.setupController(...arguments);

    controller.setup();
  }
}
