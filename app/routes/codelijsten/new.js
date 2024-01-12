import Route from '@ember/routing/route';
import { service } from '@ember/service';

export default class CodelijstenNewRoute extends Route {
  @service router;
  @service store;

  async model() {
    const conceptScheme = this.store.createRecord('concept-scheme', {
      preflabel: '<naam codelijst>',
      ispublic: true,
    });
    await conceptScheme.save();

    return conceptScheme;
  }

  afterModel(model) {
    this.router.transitionTo('codelijsten.edit', model.id);
  }
}
