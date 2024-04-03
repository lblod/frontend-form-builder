import Route from '@ember/routing/route';
import { getLocalFileContentAsText } from '../../../utils/get-local-file-content';

export default class FormbuilderEditValidationsRoute extends Route {
  async model() {
    const editRoute = this.modelFor('formbuilder.edit');
    /* eslint ember/no-controller-access-in-routes: "warn" */
    const editController = this.controllerFor('formbuilder.edit');

    const validationsTtl = await getLocalFileContentAsText(
      '/forms/validation/meta.ttl'
    );
    const fieldTtl = await getLocalFileContentAsText('/forms/builder/meta.ttl');

    return {
      graphs: editRoute.graphs,
      validationsTtl: `${validationsTtl} ${fieldTtl}`,
      handleCodeChange: editController.handleCodeChange,
    };
  }

  setupController(controller) {
    super.setupController(...arguments);

    controller.setup.perform();
  }
}
