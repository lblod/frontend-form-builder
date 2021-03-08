import Route from '@ember/routing/route';

const TEST_FORM_URI = 'http://data.lblod.info/generated-forms/simple-form';

export default class UserTestsNewRoute extends Route {

  async beforeModel() {
    const forms = await this.store.query('generated-form', {
      'filter[:uri:]': TEST_FORM_URI
    });

    if (forms.length)
      this.form = forms.firstObject;
  }

  async model() {
    const test = this.store.createRecord('user-test',{
      form: this.form
    });
    await test.save();
    return test;
  }

  afterModel(model) {
    this.transitionTo('user-tests.edit', model.id);
  }
}
