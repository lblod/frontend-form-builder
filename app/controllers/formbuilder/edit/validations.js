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

  sourceNode = PREVIEW_SOURCE_NODE;

  @action
  handleCodeChange(ttlCode) {
    this.formCodeManager.addFormCode(ttlCode);
    this.setupPreviewForm.perform();
    this.model.handleCodeChange();
  }

  setupPreviewForm = restartableTask(async () => {
    // force a component recreation by unrendering it very briefly
    // Ideally the RdfForm component would do the right thing when the formStore
    // and form arguments change, but we're not there yet.
    await timeout(1);
    // check if the form has changed here
    this.previewStore = new ForkingStore();
    this.previewStore.parse(
      this.formCodeManager.getTtlOfLatestVersion(),
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
    this.setupPreviewForm.perform();
  }
}
