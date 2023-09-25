import Route from '@ember/routing/route';
import { action } from '@ember/object';
import { service } from '@ember/service';

export default class FormsPlaygroundRoute extends Route {
  @service session;

  async beforeModel() {
    await this.session.setup();
    await this._loadCurrentSession();
  }

  async _loadCurrentSession() {
    try {
      await this.currentSession.load();
    } catch (error) {
      this.session.invalidate();
    }
  }

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
