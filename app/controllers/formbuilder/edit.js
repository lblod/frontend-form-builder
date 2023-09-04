import Controller from '@ember/controller';

import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';
import { task, timeout } from 'ember-concurrency';
import { inject as service } from '@ember/service';
import { ForkingStore } from '@lblod/ember-submission-form-fields';
import { sym as RDFNode } from 'rdflib';
import { FORM, RDF } from '../../utils/rdflib';
import { getAllFieldInForm } from '../../utils/validation/getAllFieldsInForm';
import { addIsRequiredValidationToForm } from '../../utils/validation/addValidationToForm';
import { addIsRequiredValidationToField } from '../../utils/validation/addValidationToField';
import fetch from 'fetch';

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
  @tracked isAddingValidationToForm = false;

  localeMetaTtlContentAsText = '';
  localeFormTtlContentAsText = '';

  @tracked fieldsInForm = [];

  graphs = GRAPHS;
  sourceNode = SOURCE_NODE;
  REGISTERED_FORM_TTL_CODE_KEY = 'formTtlCode';

  @tracked isInitialDataLoaded = false;

  @action
  toggleIsAddingValidationToForm() {
    this.set('isAddingValidationToForm', !this.isAddingValidationToForm);
    if (!this.isAddingValidationToForm) {
      console.log('perform refresh');
      this.refresh.perform({
        formTtlCode: this.code,
        resetBuilder: false,
        isInitialRouteCall: true,
      });
    } else {
      this.builderStore.deregisterObserver(this.REGISTERED_FORM_TTL_CODE_KEY); // TODO to remove

      this.fieldsInForm = getAllFieldInForm(
        this.code,
        this.previewStore,
        this.previewForm,
        this.graphs
      );
    }
  }

  @action
  async addIsRequiredValidationToForm() {
    console.log('addIsRequiredValidationTo FORM');

    const updatedTtlCode = addIsRequiredValidationToForm(
      'c065e16e-aeea-452c-93c0-0577f8d7bbff',
      this.builderStore,
      GRAPHS
    );
  }

  @action
  addIsRequiredValidationToField(field) {
    addIsRequiredValidationToField(
      field,
      'c065e16e-aeea-452c-93c0-0577f8d7bbff',
      this.builderStore,
      this.graphs.sourceGraph
    );

    this.serializeSourceToTtl();
  }

  @task({ restartable: true })
  *refresh({ formTtlCode, resetBuilder, isInitialRouteCall = false }) {
    // console.log({ formTtlCode });
    this.isInitialDataLoaded = !isInitialRouteCall;
    isInitialRouteCall ? null : yield timeout(500);

    if (formTtlCode) {
      this.code = formTtlCode;
    }

    if (resetBuilder) {
      this.formChanged = true;
      this.builderStore.deregisterObserver(this.REGISTERED_FORM_TTL_CODE_KEY);
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

    const formTtl = yield this.getFormTtlContent();
    const metaTtl = yield this.getMetaTtlContent();

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

    console.log({ sourceTtl });

    this.refresh.perform({ formTtlCode: sourceTtl });
  }

  async getLocalFileContentAsText(path) {
    const file = await fetch(path);

    return await file.text();
  }

  async getMetaTtlContent() {
    if (
      !this.localeMetaTtlContentAsText ||
      this.localeMetaTtlContentAsText == ''
    ) {
      this.localeMetaTtlContentAsText = await this.getLocalFileContentAsText(
        '/forms/meta.ttl'
      );
    }

    return this.localeMetaTtlContentAsText;
  }

  async getFormTtlContent() {
    if (
      !this.localeFormTtlContentAsText ||
      this.localeFormTtlContentAsText == ''
    ) {
      this.localeFormTtlContentAsText = await this.getLocalFileContentAsText(
        '/forms/form.ttl'
      );
    }

    return this.localeFormTtlContentAsText;
  }

  deregisterFromObservable() {
    if (this.builderStore instanceof ForkingStore) {
      this.builderStore.deregisterObserver(this.REGISTERED_FORM_TTL_CODE_KEY);
    }
  }
}
