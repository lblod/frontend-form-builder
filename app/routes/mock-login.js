import Route from '@ember/routing/route';
import { service } from '@ember/service';

export default class MockLoginRoute extends Route {
  @service session;
  @service store;

  queryParams = {
    page: {
      refreshModel: true,
    },
  };

  beforeModel() {
    this.session.prohibitAuthentication('index');
  }

  async model(params) {
    const filter = { provider: 'https://github.com/lblod/mock-login-service' };
    if (params.gemeente) filter.gebruiker = { achternaam: params.gemeente };

    const separteAllAccounts = await this.store.findAll('account', {});
    const separteAllGebruikers = await this.store.findAll('gebruiker', {});
    console.log('separate all accounts', [...separteAllAccounts]);
    console.log('separate all gebruikers', [...separteAllGebruikers]);
    // const account = await this.store.query('account', {
    //   include: 'gebruiker.bestuurseenheden',
    //   filter: filter,
    //   page: { size: 10, number: params.page },
    //   sort: 'gebruiker.achternaam',
    // });

    // console.log('account: ', [...account]);

    // return account;
    return null;
  }
}
