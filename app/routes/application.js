import Route from '@ember/routing/route';
import { action } from '@ember/object';

export default class FormsPlaygroundRoute extends Route {
  @action
  willTransition(transition) {
    if (this.controller.userHasEnteredData &&
      !confirm('Are you sure you want to abandon progress?')) {
      transition.abort();
    } else {
      // Bubble the `willTransition` action so that
      // parent routes can decide whether or not to abort.
      return true;
    }
  }
}
