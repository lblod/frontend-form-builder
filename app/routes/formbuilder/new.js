import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';

export default class FormbuilderNewRoute extends Route {
  @service router;
  @service store;

  async model() {
    const now = new Date();
    const newForm = await this.store.createRecord('generated-form', {
      created: now,
      modified: now,
      label: 'New form',
      comment: `Blank form`,
      ttlCode: '',
    });

    return await newForm.save();
  }
}
