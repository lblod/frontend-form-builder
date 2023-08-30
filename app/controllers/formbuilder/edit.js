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
import { parse, sym as RDFNode } from 'rdflib';
import { FORM, RDF } from '../../utils/rdflib';

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

    const fieldForm = this.previewStore.any(
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
  addIsRequiredValidationToField(field) {
    console.log('addIsRequiredValidationToField');
    console.log({ field });
  }

  @action
  removeAllValidationsFromField(field) {
    console.log('this.code', this.code);
    console.log({ field });
    const validationsInTheForm =
      field.store.graph.predicateIndex[
        '<http://lblod.data.gift/vocabularies/forms/validations>'
      ];
    console.log({ validationsInTheForm });
    const statementsToRemove = validationsInTheForm.filter((validation) => {
      return validation.subject.value == field.uri;
    });

    console.log({ statementsToRemove });

    for (const statement of statementsToRemove) {
      field.store.removeMatches(
        statement.subject,
        statement.predicate,
        statement.object,
        statement.graph
      );
    }

    console.log('Field store', field.store);
    // this.serializeSourceToTtl();

    this.builderStore = field.store;

    console.log(
      '1',
      this.builderStore.graph.statements.includes(statementsToRemove[0])
    );
    console.log(
      '2',
      this.builderStore.graph.statements.includes(statementsToRemove[1])
    );
    console.log('updated the validations of the field');
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

  deregisterFromObservable() {
    if (this.builderStore instanceof ForkingStore) {
      this.builderStore.deregisterObserver(this.REGISTERED_FORM_TTL_CODE_KEY);
    }
  }
}
