import Route from '@ember/routing/route';

import { action } from '@ember/object';
import { inject as service } from '@ember/service';
import { registerFormFields } from '@lblod/ember-submission-form-fields';
import SectionSelector from '../../components/rdf-form-fields/section-selector';
import { getLocalFileContentAsText } from '../../utils/get-local-file-content';
import CountryCodeConceptSchemeSelectorComponent from '../../components/rdf-form-fields/country-code-concept-scheme-selector';
import { GRAPHS } from '../../controllers/formbuilder/edit';
import ErrorMessageInputFieldComponent from '../../components/rdf-form-fields/error-message-input-field';
import { showErrorToasterMessage } from '../../utils/toaster-message-helper';
import RichTextEditorComponent from '../../components/rdf-form-fields/rich-text-editor';
import BegrotingstabelTotalFieldComponent from '../../components/rdf-form-fields/begrotingstabel-total-field';

export default class FormbuilderEditRoute extends Route {
  @service store;
  @service intl;
  @service('form-code-manager') formCodeManager;
  @service router;
  @service toaster;

  constructor() {
    super(...arguments);
    this.registerCustomFields();
  }

  async model(params) {
    this.formCodeManager.setFormId(params.id);
    const [generatedForm, formTtl, metaTtl] = await Promise.all([
      this.getGeneratedFormById(params.id),
      getLocalFileContentAsText('/forms/builder/form.ttl'),
      getLocalFileContentAsText('/forms/builder/meta.ttl'),
    ]);

    // eslint-disable-next-line ember/no-controller-access-in-routes
    const semanticDataController = this.controllerFor(
      'formbuilder.edit.semantic-data'
    );

    return {
      generatedForm,
      formTtl,
      metaTtl,
      graphs: GRAPHS,
      passFormInputDataTtl: semanticDataController.addNewFormInputData,
    };
  }

  setupController(controller, model) {
    super.setupController(...arguments);

    controller.setup(model);
  }

  @action
  willTransition(transition) {
    if (!this.formCodeManager.isFormIdSet()) {
      return;
    }

    const nextRoute = transition.targetName;

    if (transition.to.parent.name == 'formbuilder.edit') {
      return;
    }

    if (this.formCodeManager.isLatestDeviatingFromReference()) {
      transition.abort();
      /* eslint ember/no-controller-access-in-routes: "warn" */
      const editController = this.controllerFor('formbuilder.edit');
      editController.showSaveModal(nextRoute);
    }
  }

  resetController(controller) {
    controller.reset();
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

  registerCustomFields() {
    registerFormFields([
      {
        displayType: 'http://lblod.data.gift/display-types/sectionSelector',
        edit: SectionSelector,
      },
      {
        displayType:
          'http://lblod.data.gift/display-types/countryCodeConceptSchemeSelector',
        edit: CountryCodeConceptSchemeSelectorComponent,
      },
      {
        displayType:
          'http://lblod.data.gift/display-types/errorMessageInputField',
        edit: ErrorMessageInputFieldComponent,
      },
      {
        displayType: 'http://lblod.data.gift/display-types/richTextEditor',
        edit: RichTextEditorComponent,
      },
      {
        displayType:
          'http://lblod.data.gift/display-types/begrotingstabelTotal',
        edit: BegrotingstabelTotalFieldComponent,
      },
    ]);
  }
}
