import Route from '@ember/routing/route';

import { inject as service } from '@ember/service';

export default class FormbuilderEditValidationsRoute extends Route {
  @service('form-code-manager') formCodeManager;

  model() {
    return {
      formCode: this.formCodeManager.getTtlOfLatestVersion(),
    };
  }
}
