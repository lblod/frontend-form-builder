import Route from '@ember/routing/route';
import { service } from '@ember/service';
import { action } from '@ember/object';

export default class CodelijstenEditRoute extends Route {
  @service store;

  constructor() {
    super(...arguments);
  }

  async model(params) {
    return {
      conceptSchemeId: params.id,
    };
  }

  async setupController(controller, model) {
    super.setupController(...arguments);

    controller.setup.perform(model.conceptSchemeId);
  }

  @action
  willTransition(transition) {
    const nextRoute = transition.targetName;

    if (transition.to.parent.name == 'codelijsten.edit') {
      return;
    }

    /* eslint ember/no-controller-access-in-routes: "warn" */
    const editController = this.controllerFor('codelijsten.edit');
    if (
      !editController.isSaveDisabled ||
      !editController.hasNoEmptyConceptLabels()
    ) {
      transition.abort();
      editController.showSaveModal(nextRoute);
    }
  }
}
