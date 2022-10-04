import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';

export default class UserTestsNewRoute extends Route {
  @service store;

  async model(params) {
    const form = await this.store.findRecord('generated-form', params.form);

    const test = this.store.createRecord('user-test', {
      form: form,
    });

    await test.save();
    return test;
  }

  afterModel(model) {
    this.transitionTo('user-tests.edit', model.id);
  }
}
