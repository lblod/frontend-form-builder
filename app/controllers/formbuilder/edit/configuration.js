import Controller from '@ember/controller';

import { inject as service } from '@ember/service';

export default class FormbuilderConfigurationController extends Controller {
  @service('form-code-manager') formCodeManager;
}
