import Route from '@ember/routing/route';

export default class CodelijstenRoute extends Route {
  setupController(controller, model) {
    super.setupController(...arguments);

    controller.setup(model);
  }
}
