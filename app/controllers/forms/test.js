import Controller from '@ember/controller';

import { tracked } from '@glimmer/tracking';
import { restartableTask } from 'ember-concurrency';
import { ForkingStore } from '@lblod/ember-submission-form-fields';
import { FORM, RDF } from '@lblod/submission-form-helpers';

export default class FormsTestController extends Controller {
  @tracked form;
  @tracked formStore;

  setupForm = restartableTask(async () => {
    this.formStore = new ForkingStore();

    this.formStore.parse(
      this.model.formTtlCode,
      this.model.graphs.formGraph,
      'text/turtle'
    );

    this.form = this.formStore.any(
      undefined,
      RDF('type'),
      FORM('Form'),
      this.model.graphs.formGraph
    );
  });
}
