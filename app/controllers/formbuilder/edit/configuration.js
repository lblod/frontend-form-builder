import Controller from '@ember/controller';

import { action } from '@ember/object';
import { inject as service } from '@ember/service';
import { ForkingStore } from '@lblod/ember-submission-form-fields';
import { restartableTask } from 'ember-concurrency';
import { getPropertyGroupFields } from '../../../utils/get-property-group-items';
import { tracked } from '@glimmer/tracking';

export default class FormbuilderConfigurationController extends Controller {
  @service('form-code-manager') formCodeManager;

  @tracked sections = [];
  @tracked selectedSection;

  initialise = restartableTask(async () => {
    const builderStore = new ForkingStore();
    builderStore.parse(
      this.formCodeManager.getTtlOfLatestVersion(),
      this.model.graphs.sourceGraph.value,
      'text/turtle'
    );

    this.sections = getPropertyGroupFields(
      builderStore,
      this.model.graphs.sourceGraph
    );
  });

  get sortedSections() {
    return this.sections.sort((a, b) => {
      let fa = a.name?.value.toLowerCase(),
        fb = b.name?.value.toLowerCase();

      if (fa < fb) {
        return -1;
      }
      if (fa > fb) {
        return 1;
      }
      return 0;
    });
  }

  @action
  setSelectedSection(selectedOption) {
    this.selectedSection = selectedOption;
  }

  setup() {
    this.initialise.perform();
  }
}
