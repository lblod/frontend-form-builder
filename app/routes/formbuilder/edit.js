import Route from '@ember/routing/route';
import { action } from '@ember/object';
import { inject as service } from '@ember/service';
import { registerFormFields } from '@lblod/ember-submission-form-fields';
import PropertyGroupSelector from '../../components/rdf-form-fields/property-group-selector';
import ValidationConceptSchemeSelectorComponent from '../../components/rdf-form-fields/validation-concept-scheme-selector';
import { getLocalFileContentAsText } from '../../utils/get-local-file-content';
import CountryCodeConceptSchemeSelectorComponent from '../../components/rdf-form-fields/country-code-concept-scheme-selector';
import { GRAPHS } from '../../controllers/formbuilder/edit';

export default class FormbuilderEditRoute extends Route {
  @service store;
  @service intl;
  @service('form-code-manager') formCodeManager;

  constructor() {
    super(...arguments);
    this.registerCustomFields();
  }

  async model(params) {
    const [generatedForm, formTtl, metaTtl, conceptSchemesTtl] =
      await Promise.all([
        this.getGeneratedFormById(params.id),
        getLocalFileContentAsText('/forms/builder/form.ttl'),
        getLocalFileContentAsText('/forms/builder/meta.ttl'),
        getLocalFileContentAsText('/forms/preview/concept-schemes.ttl'),
      ]);

    return {
      generatedForm,
      formTtl,
      metaTtl,
      conceptSchemesTtl,
      graphs: GRAPHS,
    };
  }

  setupController(controller, model) {
    super.setupController(...arguments);

    controller.setup(model);
  }

  @action
  willTransition(transition) {
    const nextRoute = transition.targetName;

    console.log(`transition.to.parent.name`, transition.to.parent.name);
    if (transition.to.parent.name == 'formbuilder') {
      return;
    }

    if (this.formCodeManager.isLatestDeviatingFromReference()) {
      console.log(`ABORT`);
      transition.abort();
      /* eslint ember/no-controller-access-in-routes: "warn" */
      const editController = this.controllerFor('formbuilder.edit');
      editController.showSaveModal(nextRoute);
    }
  }

  resetController(controller) {
    console.log(`RESET`);
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
      throw this.intl.t('messages.error.couldNotFetchFormWithId', {
        id: generatedFormId,
      });
    }
  }

  registerCustomFields() {
    registerFormFields([
      {
        displayType:
          'http://lblod.data.gift/display-types/propertyGroupSelector',
        edit: PropertyGroupSelector,
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
    ]);
  }
}
