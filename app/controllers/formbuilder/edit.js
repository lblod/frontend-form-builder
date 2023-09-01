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
import { sym as RDFNode, triple } from 'rdflib';
import { FORM, RDF, NODES, CONCEPT_SCHEMES, SH } from '../../utils/rdflib';
import { v4 as uuidv4 } from 'uuid';
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

    this.builderStore.deregisterObserver(this.REGISTERED_FORM_TTL_CODE_KEY);

    const propertyGroups = getTopLevelPropertyGroups({
      store: this.previewStore,
      graphs: this.graphs,
      form: this.previewForm,
    });
    for (const group of propertyGroups) {
      const children = getChildrenForPropertyGroup(group, {
        form: this.previewForm,
        store: this.previewStore,
        graphs: this.graphs,
        sourceNode: this.sourceNode,
      });

      for (const field of children) {
        const validationTypes = validationTypesForField(field.uri, {
          store: this.previewStore,
          formGraph: this.graphs.formGraph,
        });
        this.fieldsInForm.push({
          parent: field,
          fieldName: field.rdflibLabel,
          uri: field.uri.value,
          validationTypes: validationTypes,
          store: this.previewStore,
          fieldForm: this.previewForm,
          propertyGroup: group,
        });
        console.log({ validationTypes });
      }
    }
  }

  async queryDB(query) {
    const encodedQuery = escape(query);
    const endpoint = `/sparql?query=${encodedQuery}`;
    const response = await fetch(endpoint, {
      headers: { Accept: 'application/sparql-results+json' },
    });

    if (response.ok) {
      let jsonResponds = await response.json();
      return jsonResponds.results.bindings;
    } else {
      throw new Error(
        `Request was unsuccessful: [${response.status}] ${response.statusText}`
      );
    }
  }

  async getAllValidationConceptsByQuery() {
    const validationsListId = 'dde3d2a3-e848-47ea-ba44-0f2e565f04ab';
    const query = `
    SELECT DISTINCT ?uuid ?prefLabel ?validationName {
      ?item <http://www.w3.org/2004/02/skos/core#inScheme> ${CONCEPT_SCHEMES(
        validationsListId
      )} ;
        <http://mu.semte.ch/vocabularies/core/uuid> ?uuid ;
        <http://mu.semte.ch/vocabularies/ext/validationName> ?validationName ;
        <http://www.w3.org/2004/02/skos/core#prefLabel> ?prefLabel .
    }
  `;

    console.log({ query });
    let concepts = await this.queryDB(query);

    console.log({ concepts });
  }

  @action
  async addIsRequiredValidationToForm(field) {
    console.log('addIsRequiredValidationTo FORM');

    const subject = NODES('c065e16e-aeea-452c-93c0-0577f8d7bbff');
    // const subject = NODES(uuidv4());
    const requiredConstraint = triple(
      subject,
      RDF('type'),
      FORM('RequiredConstraint'),
      GRAPHS.sourceGraph
    );
    const bagGrouping = triple(
      subject,
      FORM('grouping'),
      FORM('Bag'),
      GRAPHS.sourceGraph
    );
    const resultMessage = triple(
      subject,
      SH('resultMessage'),
      'Dit veld is verplicht',
      GRAPHS.sourceGraph
    );

    this.builderStore.addAll([requiredConstraint, bagGrouping, resultMessage]);

    this.builderForm = this.builderStore.any(
      undefined,
      RDF('type'),
      FORM('Form'),
      GRAPHS.formGraph
    );

    const sourceTtl = this.builderStore.serializeDataMergedGraph(
      GRAPHS.sourceGraph
    );

    console.log({ sourceTtl });
  }

  @action
  addIsRequiredValidationToField(field) {
    const subject = field.parent.uri;
    const predicate = FORM('validations');
    const value = NODES('c065e16e-aeea-452c-93c0-0577f8d7bbff');
    const validationTriple = triple(
      subject,
      predicate,
      value,
      this.graphs.sourceGraph
    );

    this.builderStore.addAll([validationTriple]);

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
