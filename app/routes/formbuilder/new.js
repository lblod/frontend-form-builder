import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';

export default class FormbuilderNewRoute extends Route {
  @service store;

  async model() {
    const d = new Date();
    const FormattedDateTime = `${d.getDate()}/${d.getMonth()}/${d.getFullYear()}, ${d.toLocaleTimeString()}`;
    const newForm = await this.store.createRecord('generated-form', {
      created: FormattedDateTime,
      modified: FormattedDateTime,
      label: 'New form',
      comment: `Blank form`,
      ttlCode: '',
    });

    return await newForm.save();
  }

  afterModel(model) {
    console.log(model);
    this.transitionTo('formbuilder.edit', model.id);
  }
}
