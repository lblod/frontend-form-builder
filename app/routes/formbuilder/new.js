import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';

export default class FormbuilderNewRoute extends Route {
  @service router;
  @service store;

  async model(params, transition) {
    const now = new Date();
    const { queryParams } = transition.to;

    const newForm = await this.store.createRecord('generated-form', {
      created: now,
      modified: now,
      label: queryParams.label,
      comment: queryParams.comment,
      ttlCode: '',
    });

    return await newForm.save();
  }

  afterModel(model) {
    this.router.transitionTo('formbuilder.edit', model.id);
  }
}
