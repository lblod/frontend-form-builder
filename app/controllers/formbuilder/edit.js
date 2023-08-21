import Controller from '@ember/controller';

import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';
import { task, timeout } from 'ember-concurrency';
import { inject as service } from '@ember/service';
import { ForkingStore } from '@lblod/ember-submission-form-fields';
import { sym as RDFNode } from 'rdflib';
import { FORM, RDF } from '../../utils/rdflib';
import ForkingStoreHelper from '../../utils/forking-store-helper';
import RouterHelper from '../../utils/router-helper';

export const GRAPHS = {
  formGraph: new RDFNode('http://data.lblod.info/form'),
  metaGraph: new RDFNode('http://data.lblod.info/metagraph'),
  sourceGraph: new RDFNode(`http://data.lblod.info/sourcegraph`),
};

const SOURCE_NODE = new RDFNode('http://frontend.poc.form.builder/sourcenode');

export default class FormbuilderEditController extends Controller {
  @service('meta-data-extractor') meta;
  @service store;
  @service router;

  @tracked code;

  @tracked previewStore;
  @tracked previewForm;

  @tracked builderStore;
  @tracked builderForm;

  @tracked formChanged = false;

  graphs = GRAPHS;
  sourceNode = SOURCE_NODE;

  @tracked isInitialDataLoaded = false;

  @task({ restartable: true })
  *refresh({ value, resetBuilder, isInitialRouteCall = false }) {
    this.isInitialDataLoaded = !isInitialRouteCall;
    yield timeout(500);

    if (value) {
      this.code = value;
    }

    if (resetBuilder) {
      this.formChanged = true;
      this.builderStore.deregisterObserver();
      this.builderStore = ForkingStoreHelper.getEmptyStoreValue();
    }

    this.previewStore = new ForkingStore();
    this.previewStore.parse(this.code, GRAPHS.formGraph.value, 'text/turtle');

    const meta = yield this.meta.extract(this.previewStore, { graphs: GRAPHS });
    this.previewStore.parse(meta, GRAPHS.metaGraph.value, 'text/turtle');

    this.previewForm = this.previewStore.any(
      undefined,
      RDF('type'),
      FORM('Form'),
      GRAPHS.formGraph
    );

    const formTtl = yield this.getLocalFileContentAsText('/forms/form.ttl');
    const metaTtl = yield this.getLocalFileContentAsText('/forms/meta.ttl');

    this.builderStore = new ForkingStore();
    this.builderStore.parse(formTtl, GRAPHS.formGraph.value, 'text/turtle');
    this.builderStore.parse(metaTtl, GRAPHS.metaGraph.value, 'text/turtle');
    this.builderStore.parse(this.code, GRAPHS.sourceGraph.value, 'text/turtle');

    this.builderForm = this.builderStore.any(
      undefined,
      RDF('type'),
      FORM('Form'),
      GRAPHS.formGraph
    );

    this.builderStore.registerObserver(() => {
      this.serializeSourceToTtl();
    });

    if (isInitialRouteCall == true) {
      this.setFormChanged(false);
    }

    this.isInitialDataLoaded = true;
  }

  @action
  setFormChanged(value) {
    this.formChanged = value;
  }

  @action
  serializeSourceToTtl() {
    if (!RouterHelper.isCurrentlyOnRoute(this.router, 'formbuilder.edit')) {
      this.builderStore.deregisterObserver();
      this.refresh.cancelAll();

      return;
    }

    this.formChanged = true;
    const sourceTtl = this.builderStore.serializeDataMergedGraph(
      GRAPHS.sourceGraph
    );

    this.refresh.perform({ value: sourceTtl });
  }

  async getLocalFileContentAsText(path) {
    const file = await fetch(path);

    return await file.text();
  }
}
