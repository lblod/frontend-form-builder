import Controller from '@ember/controller';

import { tracked } from '@glimmer/tracking';
import { inject as service } from '@ember/service';
import { restartableTask, timeout } from 'ember-concurrency';
import { ForkingStore } from '@lblod/ember-submission-form-fields';
import { FORM, RDF } from '../../../utils/rdflib';
import { sym as RDFNode } from 'rdflib';

const SOURCE_NODE = new RDFNode('http://frontend.poc.form.builder/sourcenode');

export default class FormbuilderEditBuilderController extends Controller {
  @service('form-code-manager') formCodeManager;

  @tracked builderStore;
  @tracked builderForm;

  @tracked previewStore;
  @tracked previewForm;

  sourceNode = SOURCE_NODE;

  setupBuilderForm = restartableTask(async () => {
    // force a component recreation by unrendering it very briefly
    // Ideally the RdfForm component would do the right thing when the formStore
    // and form arguments change, but we're not there yet.
    await timeout(1);

    this.deregisterFromObservable();

    const { formTtl, metaTtl, graphs } = this.model;

    this.builderStore = new ForkingStore();
    this.builderStore.parse(formTtl, graphs.formGraph.value, 'text/turtle');
    this.builderStore.parse(metaTtl, graphs.metaGraph.value, 'text/turtle');
    this.builderStore.parse(
      this.formCodeManager.getTtlOfLatestVersion(),
      this.model.graphs.sourceGraph.value,
      'text/turtle'
    );

    this.builderForm = this.builderStore.any(
      undefined,
      RDF('type'),
      FORM('Form'),
      graphs.formGraph
    );

    this.builderStore.registerObserver(() => {
      this.handleBuilderFormChange.perform();
    });
  });

  handleBuilderFormChange = restartableTask(async () => {
    await timeout(1); // small timeout to group multiple store observer callbacks together

    const sourceTtl = this.builderStore.serializeDataMergedGraph(
      this.model.graphs.sourceGraph
    );
    this.formCodeManager.addFormCode(sourceTtl);
    this.setup();
  });

  setup() {
    this.setupBuilderForm.perform();
    this.setupPreviewForm.perform();
  }

  deregisterFromObservable() {
    if (this.builderStore instanceof ForkingStore) {
      this.builderStore.clearObservers();
    }
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
}
