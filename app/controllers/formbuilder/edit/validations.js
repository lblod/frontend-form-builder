import Controller from '@ember/controller';

import { action } from '@ember/object';
import { inject as service } from '@ember/service';
import { restartableTask, timeout } from 'ember-concurrency';
import { tracked } from '@glimmer/tracking';
import { ForkingStore } from '@lblod/ember-submission-form-fields';
import { FORM, RDF } from '../../../utils/rdflib';
import { PREVIEW_SOURCE_NODE } from '../edit';

export default class FormbuilderEditValidationsController extends Controller {
  @service('form-code-manager') formCodeManager;

  @tracked previewStore;
  @tracked previewForm;

  @tracked formCode;

  sourceNode = PREVIEW_SOURCE_NODE;

  @action
  handleCodeChange(ttlCode) {
    this.formCodeManager.addFormCode(ttlCode);
    this.setup();
    this.model.handleCodeChange();
  }

  setupPreviewForm = restartableTask(async () => {
    // force a component recreation by unrendering it very briefly
    // Ideally the RdfForm component would do the right thing when the formStore
    // and form arguments change, but we're not there yet.
    await timeout(1);
    this.previewStore = new ForkingStore();
    this.previewStore.parse(
      this.formCode,
      this.model.graphs.formGraph,
      'text/turtle'
    );

    this.previewForm = this.previewStore.any(
      undefined,
      RDF('type'),
      FORM('Form'),
      this.model.graphs.formGraph
    );
  });

  setup() {
    this.formCode = this.formCodeManager.getTtlOfLatestVersion();
    this.setupPreviewForm.perform();
  }
}
