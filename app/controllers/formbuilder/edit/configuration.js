import Controller from '@ember/controller';

import { inject as service } from '@ember/service';
import { ForkingStore } from '@lblod/ember-submission-form-fields';
import { restartableTask } from 'ember-concurrency';
import { getPropertyGroupFields } from '../../../utils/get-property-group-items';

export default class FormbuilderConfigurationController extends Controller {
  @service('form-code-manager') formCodeManager;

  setupDataForm = restartableTask(async () => {
    const builderStore = new ForkingStore();
    builderStore.parse(
      this.formCodeManager.getTtlOfLatestVersion(),
      this.model.graphs.sourceGraph.value,
      'text/turtle'
    );

    const sections = getPropertyGroupFields(
      builderStore,
      this.model.graphs.sourceGraph
    );
    console.log({ sections });
  });

  setup() {
    this.setupDataForm.perform();
  }
}
