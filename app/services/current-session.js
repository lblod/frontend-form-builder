import Service, { inject as service } from '@ember/service';
import { tracked } from '@glimmer/tracking';

export default class CurrentSessionService extends Service {
  @service session;
  @service store;

  @tracked account;
  @tracked user;
  @tracked group;
  @tracked groupClassification;
  @tracked roles = [];

  async load() {
    if (this.session.isAuthenticated) {
      let sessionData = this.session.data.authenticated;
      let accountId = sessionData.relationships.account.data.id;
      this.account = await this.store.findRecord('account', accountId, {
        include: 'gebruiker',
      });

      this.user = await this.account.gebruiker;

      let groupId = sessionData.relationships.group.data.id;
      this.group = await this.store.findRecord('bestuurseenheid', groupId, {
        include: 'classificatie',
      });
      this.groupClassification = await this.group.classificatie;
      this.roles = sessionData.data.attributes.roles || [];
    }
  }

  canAccess(role) {
    return this.roles.includes(role);
  }

  get canRead() {
    return this.canAccess('FormBuilderAdmin');
  }

  get canWrite() {
    return this.canAccess('FormBuilderAdmin');
  }
}