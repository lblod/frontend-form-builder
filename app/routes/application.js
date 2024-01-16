import Route from '@ember/routing/route';
import { action } from '@ember/object';
import { service } from '@ember/service';

export default class FormsPlaygroundRoute extends Route {
  @service intl; // Inject the intl service

  beforeModel() {
    // Set the locale before the model is loaded (you can adjust the locale as needed)
    this.intl.setLocale(['NL']);
  }

  @action
  willTransition(transition) {
    /* eslint ember/no-controller-access-in-routes: "warn" */
    // TODO: replace this with a better setup
    if (
      this.controller.userHasEnteredData &&
      !confirm(this.intl.t('confirmation.goWithoutSaving'))
    ) {
      transition.abort();
    } else {
      // Bubble the `willTransition` action so that
      // parent routes can decide whether or not to abort.
      return true;
    }
  }
}
