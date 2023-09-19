import Controller from '@ember/controller';

import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';
import { task, timeout } from 'ember-concurrency';
import { inject as service } from '@ember/service';
import { ForkingStore } from '@lblod/ember-submission-form-fields';
import { sym as RDFNode } from 'rdflib';
import { FORM, RDF } from '../../utils/rdflib';
import { getLocalFileContentAsText } from '../../utils/get-local-file-content';

export const GRAPHS = {
  formGraph: new RDFNode('http://data.lblod.info/form'),
  metaGraph: new RDFNode('http://data.lblod.info/metagraph'),
  sourceGraph: new RDFNode(`http://data.lblod.info/sourcegraph`),
};

const SOURCE_NODE = new RDFNode('http://frontend.poc.form.builder/sourcenode');

export default class FormbuilderEditController extends Controller {
  @service('meta-data-extractor') meta;
  @service store;

  @tracked code;

  @tracked previewStore;
  @tracked previewForm;

  @tracked builderStore;
  @tracked builderForm;

  @tracked formChanged = false;

  graphs = GRAPHS;
  sourceNode = SOURCE_NODE;
  REGISTERED_FORM_TTL_CODE_KEY = 'formTtlCode';

  form_ttl_path = '/forms/builder/form.ttl';
  meta_ttl_path = '/forms/builder/meta.ttl';

  @tracked isInitialDataLoaded = false;

  @tracked isShowBuilder = true;
  @tracked fieldsInForm = [];
  formValidationService = null;

  @action
  async toggleIsAddingValidationToForm() {
    this.isShowBuilder = !this.isShowBuilder;
    if (this.isShowBuilder) {
      this.refresh.perform({
        formTtlCode: this.code,
        resetBuilder: false,
        isInitialRouteCall: true,
      });
    } else {
      this.deregisterFromObservable();
    }
  }

  @action
  refreshThis(parameters) {
    this.refresh.perform(parameters);
  }

  @task({ restartable: true })
  *refresh({ formTtlCode, resetBuilder, isInitialRouteCall = false }) {
    this.isInitialDataLoaded = !isInitialRouteCall;
    isInitialRouteCall ? null : yield timeout(500);

    if (formTtlCode) {
      this.code = formTtlCode;
    }

    if (resetBuilder) {
      this.formChanged = true;
      this.deregisterFromObservable();
      this.builderStore = '';
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

    const formTtl = yield getLocalFileContentAsText(this.form_ttl_path);
    const metaTtl = yield getLocalFileContentAsText(this.meta_ttl_path);

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
    }, this.REGISTERED_FORM_TTL_CODE_KEY);

    if (isInitialRouteCall) {
      this.setFormChanged(false);
      this.isAddingValidationToForm = false;
    }

    this.isInitialDataLoaded = true;
  }

  @action
  setFormChanged(value) {
    this.formChanged = value;
  }

  @action
  serializeSourceToTtl() {
    this.formChanged = true;
    const sourceTtl = this.builderStore.serializeDataMergedGraph(
      GRAPHS.sourceGraph
    );

    this.refresh.perform({ formTtlCode: sourceTtl });
  }

  deregisterFromObservable() {
    if (this.builderStore instanceof ForkingStore) {
      this.builderStore.deregisterObserver(this.REGISTERED_FORM_TTL_CODE_KEY);
    }
  }
}
