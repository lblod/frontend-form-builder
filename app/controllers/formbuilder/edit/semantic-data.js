import Controller from '@ember/controller';

import { restartableTask } from 'ember-concurrency';

export default class FormbuilderEditSemanticDataController extends Controller {
  model;

  setupData = restartableTask(async () => {
    console.log(`Setup data for ttl:`, { ttl: this.formTtl });
  });

  setup(model) {
    this.model = model;

    this.setupData.perform();
  }

  get formTtl() {
    return this.model.ttlCode;
  }
}
