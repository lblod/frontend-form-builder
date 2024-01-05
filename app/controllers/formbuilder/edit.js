import Controller from '@ember/controller';

import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';
import { inject as service } from '@ember/service';
import { sym as RDFNode } from 'rdflib';
import basicFormTemplate from '../../utils/basic-form-template';
import { restartableTask, timeout } from 'ember-concurrency';
import { ForkingStore } from '@lblod/ember-submission-form-fields';
import { FORM, RDF } from '../../utils/rdflib';
import { getTtlWithDuplicateValidationsRemoved } from '../../utils/clean-up-ttl/remove-all-duplicate-validations';

export const GRAPHS = {
  formGraph: new RDFNode('http://data.lblod.info/form'),
  metaGraph: new RDFNode('http://data.lblod.info/metagraph'),
  sourceGraph: new RDFNode(`http://data.lblod.info/sourcegraph`),
};

export const PREVIEW_SOURCE_NODE = new RDFNode(
  'http://frontend.poc.form.builder/sourcenode'
);

export default class FormbuilderEditController extends Controller {
  @service store;
  @service router;
  @service('form-code-manager') formCodeManager;

  @tracked formCode;

  @tracked formChanged;

  @tracked previewStore;
  @tracked previewForm;

  sourceNode = PREVIEW_SOURCE_NODE;

  @action
  setFormChanged(value) {
    this.formChanged = value;
  }

  @action
  handleCodeChange(newCode) {
    if (newCode) {
      this.formCode = newCode;
      const ttlWithoutDuplicateValidations =
        getTtlWithDuplicateValidationsRemoved(this.formCode);
      this.formCodeManager.addFormCode(ttlWithoutDuplicateValidations);
    }
    this.setFormChanged(this.formCodeManager.isLatestDeviatingFromReference());
    this.setupPreviewForm.perform(this.formCodeManager.getTtlOfLatestVersion());
  }

  setupPreviewForm = restartableTask(async (ttlCode) => {
    // force a component recreation by unrendering it very briefly
    // Ideally the RdfForm component would do the right thing when the formStore
    // and form arguments change, but we're not there yet.
    await timeout(1);

    this.previewStore = new ForkingStore();
    // todo: could cause some lag(modifier: editor.js)
    this.previewStore.parse(
      this.model.conceptSchemesTtl,
      this.model.graphs.metaGraph,
      'text/turtle'
    );

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
  });

  setup(model) {
    this.formCode = this.getFormTtlCode(model.generatedForm);
    this.formCodeManager.addFormCode(this.formCode);
    this.formCodeManager.pinLatestVersionAsReference();

    this.router.transitionTo('formbuilder.edit.code');
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
