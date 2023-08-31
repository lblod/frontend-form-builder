import Controller from '@ember/controller';

import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';
import { task, timeout } from 'ember-concurrency';
import { inject as service } from '@ember/service';
import {
  ForkingStore,
  getTopLevelPropertyGroups,
  getChildrenForPropertyGroup,
  validationTypesForField,
} from '@lblod/ember-submission-form-fields';
import { Namespace, sym as RDFNode, quad, triple } from 'rdflib';
import { FORM, RDF, NODES } from '../../utils/rdflib';
import { v4 as uuidv4 } from 'uuid';

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

  @tracked fieldsInForm = [];

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
      this.getAllFieldsInTheForm();
    }
  }

  graphs = GRAPHS;
  sourceNode = SOURCE_NODE;
  REGISTERED_FORM_TTL_CODE_KEY = 'formTtlCode';

  @tracked isInitialDataLoaded = false;

  @action
  async getAllFieldsInTheForm() {
    this.fieldsInForm = [];
    if (this.code == '') {
      return null;
    }

    const fieldStore = new ForkingStore();
    fieldStore.parse(this.code, GRAPHS.formGraph.value, 'text/turtle');
    const metaTtl = await this.getMetaTtlContent();
    fieldStore.parse(metaTtl, GRAPHS.metaGraph.value, 'text/turtle');

    const fieldForm = fieldStore.any(
      undefined,
      RDF('type'),
      FORM('Form'),
      GRAPHS.formGraph
    );

    const propertyGroups = getTopLevelPropertyGroups({
      store: fieldStore,
      graphs: this.graphs,
      form: fieldForm,
    });
    for (const group of propertyGroups) {
      const children = getChildrenForPropertyGroup(group, {
        form: fieldForm,
        store: fieldStore,
        graphs: this.graphs,
        sourceNode: this.sourceNode,
      });

      for (const field of children) {
        const validationTypes = validationTypesForField(field.uri, {
          store: fieldStore,
          formGraph: this.graphs.formGraph,
        });
        this.fieldsInForm.push({
          parent: field,
          fieldName: field.rdflibLabel,
          uri: field.uri.value,
          validationTypes: validationTypes,
          store: fieldStore,
          fieldForm: fieldForm,
        });
        console.log({ validationTypes });
      }
    }
  }

  @action
  addIsRequiredValidationToForm() {
    console.log('addIsRequiredValidationTo FORM');
    const subject = NODES('c065e16e-aeea-452c-93c0-0577f8d7bbff');
    // const subject = NODES(uuidv4());
    const predicate = FORM('validations');
    const value = FORM('RequiredConstraint');
    console.log({ subject });
    const validationTriple = quad(
      subject,
      predicate,
      value,
      this.graphs.sourceGraph
    );

    console.log({ validationTriple });
    this.builderStore.addAll([validationTriple]);
    console.log(this.builderStore);
  }

  @action
  addIsRequiredValidationToField(field) {
    console.log('addIsRequiredValidationTo FIELD');
    console.log({ field });
    const subject = field.parent.uri;
    const predicate = FORM('validations');
    const value = NODES('c065e16e-aeea-452c-93c0-0577f8d7bbff');
    console.log({ subject });
    const validationTriple = triple(
      subject,
      predicate,
      value,
      this.graphs.sourceGraph
    );

    console.log({ validationTriple });
    this.builderStore.addAll([validationTriple]);
  }

  @task({ restartable: true })
  *refresh({ formTtlCode, resetBuilder, isInitialRouteCall = false }) {
    console.log({ formTtlCode });
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

    const formTtl = yield this.getLocalFileContentAsText('/forms/form.ttl');
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

    console.log('this.builderStore', this.builderStore);
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

  deregisterFromObservable() {
    if (this.builderStore instanceof ForkingStore) {
      this.builderStore.deregisterObserver(this.REGISTERED_FORM_TTL_CODE_KEY);
    }
  }
}
