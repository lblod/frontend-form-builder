import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';
import { registerFormFields } from '@lblod/ember-submission-form-fields';
import PropertyGroupSelector from '../../components/rdf-form-fields/property-group-selector';
import ValidationConceptSchemeSelectorComponent from '../../components/rdf-form-fields/validation-concept-scheme-selector';
import { getLocalFileContentAsText } from '../../utils/get-local-file-content';
import CountryCodeConceptSchemeSelectorComponent from '../../components/rdf-form-fields/country-code-concept-scheme-selector';
import { GRAPHS } from '../../controllers/formbuilder/edit';

export default class FormbuilderEditRoute extends Route {
  @service store;
  @service('codelists') codelistsService;

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

    if (!this.codelistsService.findTurtleText()) {
      console.log(`Gebruik van lokale codelijsten`);
    }

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
      throw `Could not fetch generated-form with id: ${generatedFormId}`;
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
