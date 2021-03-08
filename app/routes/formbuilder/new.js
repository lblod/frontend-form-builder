import Route from '@ember/routing/route';

export default class FormbuilderNewRoute extends Route {
  async model() {
    const newForm = await this.store.createRecord('generated-form',{
      created: new Date(),
      modified: new Date(),
      label: "New form",
      comment: `Blank form created at ${new Date().toISOString().replace('-', '/').split('T')[0].replace('-', '/')}`,
      ttlCode: ""
    })

    return await newForm.save();
  }

  afterModel(model) {
    console.log(model)
    this.transitionTo('formbuilder.edit', model.id);
  }
}
