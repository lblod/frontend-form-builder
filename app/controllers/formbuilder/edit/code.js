import Controller from '@ember/controller';

import { inject as service } from '@ember/service';
import { restartableTask, timeout } from 'ember-concurrency';
import { tracked } from '@glimmer/tracking';
import { ForkingStore } from '@lblod/ember-submission-form-fields';
import { FORM, RDF } from '../../../utils/rdflib';
import { PREVIEW_SOURCE_NODE } from '../edit';

export default class FormbuilderEditCodeController extends Controller {
  @service('form-code-manager') formCodeManager;

  @tracked formCode;
  @tracked formCodeUpdates;

  @tracked previewStore;
  @tracked previewForm;

  sourceNode = PREVIEW_SOURCE_NODE;

  constructor() {
    super(...arguments);
  }

  setup() {
    this.formCode = this.formCodeManager.getTtlOfLatestVersion();
    this.formCodeUpdates = this.formCode;
    this.setupPreviewForm.perform(this.formCode);
  }

  handleCodeChange = restartableTask(async (newCode) => {
    if (this.formCodeManager.isTtlTheSameAsLatest(newCode)) {
      return;
    }

    // The newCode is not assigned to this.fromCode as than the editor
    // loses focus as you are udpating the content in the editor.
    // Keeping the changes in another variable and at the end assigning
    // the formCode to the updated code
    this.formCodeUpdates = newCode;
    this.setupPreviewForm.perform(this.formCodeUpdates);
  });

  setupPreviewForm = restartableTask(async (ttlCode) => {
    // force a component recreation by unrendering it very briefly
    // Ideally the RdfForm component would do the right thing when the formStore
    // and form arguments change, but we're not there yet.
    await timeout(1);
    this.previewStore = new ForkingStore();
    this.previewStore.parse(
      ttlCode,
      this.model.graphs.formGraph,
      'text/turtle'
    );

    this.previewForm = this.previewStore.any(
      undefined,
      RDF('type'),
      FORM('Form'),
      this.model.graphs.formGraph
    );
    this.model.handleCodeChange(ttlCode);
  });
}
