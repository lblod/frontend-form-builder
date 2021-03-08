import Route from '@ember/routing/route';

export default class UserTestsNewRoute extends Route {
  async model(params) {
    const userTest = (
      await this.store.query('user-test', {
        'filter[form][:id:]': params.id,
      })
    )[0];

    if (userTest) {
      return userTest;
    } else {
      const form = await this.store.find('generated-form', params.id);
      const test = this.store.createRecord('user-test', {
        form: form,
      });
      await test.save();
      return test;
    }
  }

  afterModel(model) {
    this.transitionTo('user-tests.edit', model.id);
  }
}
