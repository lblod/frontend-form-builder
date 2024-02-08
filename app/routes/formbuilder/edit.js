import Route from '@ember/routing/route';

import { action } from '@ember/object';
import { inject as service } from '@ember/service';
import { registerFormFields } from '@lblod/ember-submission-form-fields';
import SectionSelector from '../../components/rdf-form-fields/section-selector';
import ValidationConceptSchemeSelectorComponent from '../../components/rdf-form-fields/validation-concept-scheme-selector';
import { getLocalFileContentAsText } from '../../utils/get-local-file-content';
import CountryCodeConceptSchemeSelectorComponent from '../../components/rdf-form-fields/country-code-concept-scheme-selector';
import { GRAPHS } from '../../controllers/formbuilder/edit';
import ErrorMessageInputFieldComponent from '../../components/rdf-form-fields/error-message-input-field';
import { showErrorToasterMessage } from '../../utils/toaster-message-helper';
import ListingCalculationTableComponent from '../../components/listing-calculation-table';

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
          'http://lblod.data.gift/display-types/validationConceptSchemeSelector',
        edit: ValidationConceptSchemeSelectorComponent,
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
        displayType:
          'http://lblod.data.gift/display-types/ListingCalculationTable',
        edit: ListingCalculationTableComponent,
      },
    ]);
  }
}
