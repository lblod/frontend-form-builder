import Controller from '@ember/controller';

import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';
import { task, timeout } from 'ember-concurrency';
import { inject as service } from '@ember/service';
import { ForkingStore } from '@lblod/ember-submission-form-fields';
import { sym as RDFNode } from 'rdflib';
import { FORM, RDF } from '../../utils/rdflib';
import { getAllFieldInForm } from '../../utils/validation/getAllFieldsInForm';
import { addIsRequiredValidationToField } from '../../utils/validation/addIsRequiredValidationToField';
import { getAllValidationConceptsByQuery } from '../../utils/validation/getAllValidationConceptsByQuery';
import fetch from 'fetch';
import ConceptSchemeHelper from '../../utils/concept-scheme-helper';
import { VALIDATION_IDS } from '../../utils/static-templates/validations-turtle-template';

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
  @tracked fieldsInForm = [];

  localeMetaTtlContentAsText = '';
  localeFormTtlContentAsText = '';

  @tracked validationOptions;
  @tracked selectedValidations;

  validationConceptSchemeHelper = ConceptSchemeHelper.createEmpty();

  graphs = GRAPHS;
  sourceNode = SOURCE_NODE;

  REGISTERED_FORM_TTL_CODE_KEY = 'formTtlCode';

  @tracked isInitialDataLoaded = false;

  @action
  async toggleIsAddingValidationToForm() {
    this.set('isAddingValidationToForm', !this.isAddingValidationToForm);
    if (!this.isAddingValidationToForm) {
      this.refresh.perform({
        formTtlCode: this.code,
        resetBuilder: false,
        isInitialRouteCall: true,
      });
    } else {
      this.deregisterFromObservable();
      this.fieldsInForm = getAllFieldInForm(
        this.code,
        this.previewStore,
        this.previewForm,
        GRAPHS
      );

      if (this.validationConceptSchemeHelper.getAll().length == 0) {
        const validationConcepts = await getAllValidationConceptsByQuery();
        this.validationConceptSchemeHelper.addConcepts(validationConcepts);
        this.validationOptions = [];
      }

      this.validationConceptSchemeHelper.shortenConceptListToIds(
        VALIDATION_IDS
      );

      this.validationOptions =
        this.validationConceptSchemeHelper.getMappedConceptPropertyValues(
          'prefLabel'
        );
    }
  }

  @action
  addIsRequiredValidationToField(field) {
    console.log(this.selectedValidations);

    const validationsToAdd = [];
    for (const validationLabel of this.selectedValidations) {
      const uuidForPropertyValue =
        this.validationConceptSchemeHelper.getUuidOfConceptByPropertyValue(
          validationLabel
        );
      validationsToAdd.push(uuidForPropertyValue);
    }

    addIsRequiredValidationToField(
      field.uri,
      validationsToAdd,
      this.builderStore,
      this.graphs.sourceGraph
    );

    const updatedTtlCode = this.builderStore.serializeDataMergedGraph(
      GRAPHS.sourceGraph
    );

    this.refresh.perform({
      formTtlCode: updatedTtlCode,
      isInitialRouteCall: false,
    });
    // TODO: all fields have to be fetched again so the list is updated
    this.setFormChanged(true);
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
