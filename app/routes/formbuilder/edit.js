import Route from '@ember/routing/route';
import template from '../../utils/basic-form-template';
import { inject as service } from '@ember/service';
import { registerFormFields } from '@lblod/ember-submission-form-fields';
import PropertyGroupSelector from '../../components/rdf-form-fields/property-group-selector';
import ValidationConceptSchemeSelectorComponent from '../../components/rdf-form-fields/validation-concept-scheme-selector';

export default class FormbuilderEditRoute extends Route {
  @service store;

  constructor() {
    super(...arguments);
    this.registerCustomFields();
  }

  async model(params) {
    return await this.getGeneratedFormById(params.id);
  }

  setupController(controller, model) {
    super.setupController(...arguments);
    controller.refresh.perform({
      formTtlCode: this.getFormTtlCode(model),
      resetBuilder: false,
      isInitialRouteCall: true,
    });
  }

  resetController(controller) {
    controller.deregisterFromObservable();
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
    ]);
  }

  getFormTtlCode(model) {
    if (!model.ttlCode || model.ttlCode == '') {
      return template;
    }

    return model.ttlCode;
  }
}
