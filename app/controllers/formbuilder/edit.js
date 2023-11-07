import Controller from '@ember/controller';

import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';
import { restartableTask, timeout } from 'ember-concurrency';
import { inject as service } from '@ember/service';
import { ForkingStore } from '@lblod/ember-submission-form-fields';
import { sym as RDFNode } from 'rdflib';
import { FORM, RDF } from '../../utils/rdflib';
import basicFormTemplate from '../../utils/basic-form-template';

export const GRAPHS = {
  formGraph: new RDFNode('http://data.lblod.info/form'),
  metaGraph: new RDFNode('http://data.lblod.info/metagraph'),
  sourceGraph: new RDFNode(`http://data.lblod.info/sourcegraph`),
};

const SOURCE_NODE = new RDFNode('http://frontend.poc.form.builder/sourcenode');

export default class FormbuilderEditController extends Controller {
  @service store;
  @service('form-code-manager') formCodeManager;

  @tracked formCode;

  @tracked previewStore;
  @tracked previewForm;

  @tracked formChanged = false;

  graphs = GRAPHS;
  sourceNode = SOURCE_NODE;

  setupPreviewForm = restartableTask(async () => {
    // force a component recreation by unrendering it very briefly
    // Ideally the RdfForm component would do the right thing when the formStore
    // and form arguments change, but we're not there yet.
    await timeout(1);
    this.formCodeManager.addFormCode(this.formCode);
    this.setFormChanged(this.formCodeManager.isLatestDeviatingFromReference());

    this.previewStore = new ForkingStore();
    this.previewStore.parse(
      this.formCode,
      GRAPHS.formGraph.value,
      'text/turtle'
    );

    this.previewForm = this.previewStore.any(
      undefined,
      RDF('type'),
      FORM('Form'),
      GRAPHS.formGraph
    );
  });

  @action
  setFormChanged(value) {
    this.formChanged = value;
  }

  @action
  async handleCodeChange(newCode) {
    this.formCode = newCode;
    this.setupPreviewForm.perform();
  }

  setup(model) {
    this.formCode = this.getFormTtlCode(model.generatedForm);
    this.formCodeManager.addFormCode(this.formCode);
    this.formCodeManager.pinLatestVersionAsReference();
    this.setupPreviewForm.perform();
  }

  reset() {
    this.formCodeManager.clearHistory();
  }

  getFormTtlCode(generatedForm) {
    if (!generatedForm.ttlCode || generatedForm.ttlCode == '') {
      return basicFormTemplate;
    }

    return generatedForm.ttlCode;
  }
}
