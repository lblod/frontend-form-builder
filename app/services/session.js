import { warn } from '@ember/debug';
import { inject as service } from '@ember/service';
import SessionService from 'ember-simple-auth/services/session';
// import ENV from 'frontend-subsidiedatabank/config/environment';

export default class AppSessionService extends SessionService {
  @service currentSession;

  async handleAuthentication(routeAfterAuthentication) {
    await this.currentSession.load();
    super.handleAuthentication(routeAfterAuthentication);
  }

  handleInvalidation() {
    // const logoutUrl = ENV['torii']['providers']['acmidm-oauth2']['logoutUrl'];
    const logoutUrl = null;
    if (logoutUrl.startsWith('http')) {
      super.handleInvalidation(logoutUrl);
    } else {
      warn('Incorrect logout URL configured', {
        id: 'session-invalidation-failure',
      });
    }
  }
}
