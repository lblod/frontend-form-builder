import Component from '@glimmer/component';

import { action } from '@ember/object';
import { inject as service } from '@ember/service';
import { tracked } from '@glimmer/tracking';
import { task, timeout } from 'ember-concurrency';
import { ForkingStore } from '@lblod/ember-submission-form-fields';
import {
  parseStoreGraphs,
  validationGraphs,
} from '../utils/validation/helpers';
import { isForkingStore } from '../utils/forking-store-helpers';
import { showErrorToasterMessage } from '../utils/toaster-message-helper';
import { getFieldsInStore } from '../utils/get-triples-per-field-in-store';
import { createStoreForFieldData } from '../utils/create-store-for-field';
import { addValidationTriplesToFormNodesL } from '../utils/validation/add-field-valdiations-to-formNodesL';
import { getFieldAndValidationTriples } from '../utils/get-field-and-validation-triples';
import { areValidationsInGraphValidated } from '../utils/validation/are-validations-in-graph-validated';

export default class AddValidationsToFormComponent extends Component {
  @tracked storesWithForm;

  @service toaster;
  @tracked selectedField;

  builderStore;
  savedBuilderTtlCode;

  graphs = validationGraphs;

  constructor() {
    super(...arguments);

    if (!this.args.builderTtlCode || this.args.builderTtlCode == '') {
      const errorMessage = `Cannot add validations to an empty form.`;
      showErrorToasterMessage(this.toaster, errorMessage);

      throw errorMessage;
    }
    this.storesWithForm = [];
    this.savedBuilderTtlCode = this.args.builderTtlCode;

    this.initialise.perform({ ttlCode: this.savedBuilderTtlCode });
  }

  @task({ restartable: false })
  *initialise({ ttlCode }) {
    this.builderStore = new ForkingStore();
    yield parseStoreGraphs(this.builderStore, ttlCode);

    this.storesWithForm = yield this.createSeparateStorePerField(
      this.builderStore
    );
    this.storesWithForm.length >= 1
      ? (this.selectedField = this.storesWithForm[0])
      : null;
  }

  @action
  async setSelectedField(storeWithForm) {
    this.selectedField = null;
    await timeout(1);
    this.selectedField = storeWithForm;
  }

  @action
  updateTtlCodeWithField({ fieldSubject, triples }) {
    const builderStoreTriples = getFieldAndValidationTriples(
      fieldSubject,
      this.builderStore,
      this.graphs.sourceGraph
    );

    this.builderStore.removeStatements(builderStoreTriples);
    this.builderStore.addAll(triples);

    const newBuilderForm = this.builderStore.serializeDataMergedGraph(
      this.graphs.sourceGraph
    );

    if (
      areValidationsInGraphValidated(this.builderStore, this.graphs.sourceGraph)
    ) {
      this.args.onNewBuilderForm(newBuilderForm);
    }
  }

  async createSeparateStorePerField(store) {
    const fieldsData = getFieldsInStore(store, this.graphs.sourceGraph);
    const storesWithForm = [];

    for (const fieldData of fieldsData) {
      const fieldStoreWithForm = await createStoreForFieldData(
        fieldData,
        this.savedBuilderTtlCode,
        this.graphs
      );

      addValidationTriplesToFormNodesL(
        fieldStoreWithForm.subject,
        fieldStoreWithForm.store,
        this.graphs
      );

      storesWithForm.push(fieldStoreWithForm);
    }

    return storesWithForm;
  }

  willDestroy() {
    super.willDestroy(...arguments);

    for (const storeWithForm of this.storesWithForm) {
      if (isForkingStore(storeWithForm.store)) {
        storeWithForm.store.clearObservers();
      }
    }
  }
}
