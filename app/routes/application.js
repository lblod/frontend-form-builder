import Route from '@ember/routing/route';
import { action } from '@ember/object';

export default class FormsPlaygroundRoute extends Route {
  @action
  willTransition(transition) {
    /* eslint ember/no-controller-access-in-routes: "warn" */
    // TODO: replace this with a better setup
    if (
      this.controller.userHasEnteredData &&
      !confirm('Are you sure you want to abandon progress?')
    ) {
      transition.abort();
    } else {
      // Bubble the `willTransition` action so that
      // parent routes can decide whether or not to abort.
      return true;
    }
  }
}
