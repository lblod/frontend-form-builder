import Route from '@ember/routing/route';

export default class UserTestsNewRoute extends Route {

  async model(params) {
    const form = await this.store.find('generated-form', params.form);

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
