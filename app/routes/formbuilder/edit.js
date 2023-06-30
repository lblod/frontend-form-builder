import Route from '@ember/routing/route';
import template from '../../utils/basic-form-template';
import { inject as service } from '@ember/service';
import { registerFormFields } from '@lblod/ember-submission-form-fields';
import PropertyGroupSelector from '../../components/rdf-form-fields/property-group-selector';

export default class FormbuilderEditRoute extends Route {
  @service store;

  constructor() {
    super(...arguments);
    this.registerCustomFields();
  }

  model(params) {
    return this.store.findRecord('generated-form', params.id);
  }

  setupController(controller, model) {
    super.setupController(...arguments);
    controller.refresh.perform({
      value: model.ttlCode ? model.ttlCode : template,
    });
  }

  registerCustomFields() {
    registerFormFields([
      {
        displayType:
          'http://lblod.data.gift/display-types/propertyGroupSelector',
        edit: PropertyGroupSelector,
      },
    ]);
  }
}
