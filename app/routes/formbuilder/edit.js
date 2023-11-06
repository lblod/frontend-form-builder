import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';
import { registerFormFields } from '@lblod/ember-submission-form-fields';
import PropertyGroupSelector from '../../components/rdf-form-fields/property-group-selector';
import ValidationConceptSchemeSelectorComponent from '../../components/rdf-form-fields/validation-concept-scheme-selector';
import { getLocalFileContentAsText } from '../../utils/get-local-file-content';
import CountryCodeConceptSchemeSelectorComponent from '../../components/rdf-form-fields/country-code-concept-scheme-selector';
import { ForkingStore } from '@lblod/ember-submission-form-fields';
import { GRAPHS } from '../../controllers/formbuilder/edit';
import { FORM, RDF } from '../../utils/rdflib';
import basicFormTemplate from '../../utils/basic-form-template';

export default class FormbuilderEditRoute extends Route {
  @service store;

  constructor() {
    super(...arguments);
    this.registerCustomFields();
  }

  async model(params) {
    const [generatedForm, formTtl, metaTtl] = await Promise.all([
      this.getGeneratedFormById(params.id),
      getLocalFileContentAsText('/forms/builder/form.ttl'),
      getLocalFileContentAsText('/forms/builder/meta.ttl'),
    ]);
    const ttlCode = this.getFormTtlCode(generatedForm);
    const formStore = await this.setupFormStore(ttlCode);

    return {
      generatedForm,
      ttlCode: ttlCode,
      formTtl, // deprecated
      metaTtl, // deprecated
      graphs: GRAPHS,
      formStore: formStore,
      form: formStore.any(
        undefined,
        RDF('type'),
        FORM('Form'),
        GRAPHS.formGraph
      ),
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

  async setupFormStore(ttlCode) {
    const [formTtl, metaTtl] = await Promise.all([
      getLocalFileContentAsText('/forms/builder/form.ttl'),
      getLocalFileContentAsText('/forms/builder/meta.ttl'),
    ]);

    const formStore = new ForkingStore();
    formStore.parse(formTtl, GRAPHS.formGraph.value, 'text/turtle');
    formStore.parse(metaTtl, GRAPHS.metaGraph.value, 'text/turtle');
    formStore.parse(ttlCode, GRAPHS.sourceGraph.value, 'text/turtle');

    return formStore;
  }

  getFormTtlCode(generatedForm) {
    if (!generatedForm.ttlCode || generatedForm.ttlCode == '') {
      return basicFormTemplate;
    }

    return generatedForm.ttlCode;
  }
}
