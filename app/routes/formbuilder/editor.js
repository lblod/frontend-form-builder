import Route from '@ember/routing/route';

import { service } from '@ember/service';
import { getLocalFileContentAsText } from '../../utils/get-local-file-content';
import { GRAPHS } from '../../controllers/formbuilder/edit';
import { showErrorToasterMessage } from '../../utils/toaster-message-helper';

export default class FormbuilderEditorRoute extends Route {
  @service store;
  @service intl;
  @service('form-code-manager') formCodeManager;
  @service router;
  @service toaster;

  async model(params) {
    this.formCodeManager.setFormId(params.id);
    const [generatedForm, formTtl, metaTtl] = await Promise.all([
      this.getGeneratedFormById(params.id),
      getLocalFileContentAsText('/forms/builder/form.ttl'),
      getLocalFileContentAsText('/forms/builder/meta.ttl'),
    ]);

    return {
      generatedForm,
      formTtl,
      metaTtl,
      graphs: GRAPHS,
    };
  }

  setupController(controller, model) {
    super.setupController(...arguments);

    controller.setup(model);
  }

  async getGeneratedFormById(generatedFormId) {
    try {
      const form = await this.store.findRecord(
        'generated-form',
        generatedFormId
      );

      return form;
    } catch (error) {
      this.router.transitionTo('index');
      showErrorToasterMessage(
        this.toaster,
        this.intl.t('messages.error.couldNotFetchFormWithId', {
          id: generatedFormId,
        })
      );
    }
  }
}
