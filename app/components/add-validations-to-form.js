import Component from '@glimmer/component';

import { inject as service } from '@ember/service';
import { tracked } from '@glimmer/tracking';
import { task } from 'ember-concurrency';
import { ForkingStore } from '@lblod/ember-submission-form-fields';
import { FORM, EXT } from '../utils/rdflib';
import { areValidationsInGraphValidated } from '../utils/validation/are-validations-in-graph-validated';
import {
  getFirstFieldSubject,
  parseStoreGraphs,
  validationGraphs,
} from '../utils/validation/helpers';
import { Statement } from 'rdflib';
import {
  getNodeValidationTriples,
  getTriplesWithNodeAsSubject,
  getValidationSubjectsOnNode,
  isForkingStore,
} from '../utils/forking-store-helpers';
import { showErrorToasterMessage } from '../utils/toaster-message-helper';
import { getFieldsInStore } from '../utils/get-triples-per-field-in-store';
import { createStoreForFieldData } from '../utils/create-store-for-field';
import { getFieldAndValidationTriples } from '../utils/get-field-and-validation-triples';
import { mergeFieldValidationFormWithBuilderForm as mergeFieldDataWithBuilderForm } from '../utils/merge-field-data-with-builder-form';
import { addValidationTriplesToFormNodesL } from '../utils/validation/add-field-valdiations-to-formNodesL';

export default class AddValidationsToFormComponent extends Component {
  @tracked storesWithForm;

  @service toaster;
  @service('forking-store-manager') forkingStoreManager;

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
    this.forkingStoreManager.setBuilderStore(new ForkingStore());
    yield parseStoreGraphs(this.forkingStoreManager.getBuilderStore(), ttlCode);

    this.storesWithForm = yield this.createSeparateStorePerField(
      this.forkingStoreManager.getBuilderStore()
    );

    this.registerToObservableForStoresWithForm(this.storesWithForm);
  }

  async mergeThFieldFormsWithTheBuilderForm() {
    this.deregisterFromObservableForStoresWithForm(this.storesWithForm);

    for (const fieldData of this.getFieldsData()) {
      const storeWithMergedField = await mergeFieldDataWithBuilderForm(
        fieldData,
        this.savedBuilderTtlCode,
        this.graphs
      );

      const sourceTtl = storeWithMergedField.serializeDataMergedGraph(
        this.graphs.sourceGraph
      );
      this.savedBuilderTtlCode = sourceTtl;
    }
    console.log(`Stores before the update to the parent`);
    console.log(this.forkingStoreManager.getStoreOverView());
    this.args.onUpdateValidations(this.savedBuilderTtlCode);
  }

  getFieldsData() {
    const fieldsData = [];

    for (const storeWithForm of this.storesWithForm) {
      const isValidTtl = areValidationsInGraphValidated(
        storeWithForm.store,
        this.graphs.sourceGraph
      );
      if (isValidTtl) {
        const triples = getFieldAndValidationTriples(
          storeWithForm.subject,
          storeWithForm.store,
          this.graphs.sourceGraph
        );

        fieldsData.push({
          store: storeWithForm.store,
          subject: storeWithForm.subject,
          triples: triples,
        });
      } else {
        showErrorToasterMessage(
          this.toaster,
          `Form of field with subject: ${storeWithForm.subject} is invalid.`
        );
        console.error(
          `Current invalid field ttl for subject: ${storeWithForm.subject}`,
          storeWithForm.store.serializeDataMergedGraph(this.graphs.sourceGraph)
        );
      }
    }

    return fieldsData;
  }

  @task({ restartable: true })
  *updatedFormFieldValidations(builderStore) {
    if (
      !areValidationsInGraphValidated(builderStore, this.graphs.sourceGraph)
    ) {
      return;
    }

    const field = getFirstFieldSubject(builderStore);
    // Stop the observing to block off an infinite loop (updating the sourceGraph here)
    builderStore.clearObservers();
    const formNodesLValidationSubjects = getValidationSubjectsOnNode(
      EXT('formNodesL'),
      builderStore,
      this.graphs.sourceGraph
    );
    const fieldValidationNodes = getNodeValidationTriples(
      field,
      builderStore,
      this.graphs.sourceGraph
    );

    this.removeValidationTriplesFromFieldThatAreRemovedFromFormNodesL(
      formNodesLValidationSubjects,
      fieldValidationNodes,
      builderStore
    );

    for (const nodeSubject of formNodesLValidationSubjects) {
      const triplesOfValidationFormNodesL = getTriplesWithNodeAsSubject(
        nodeSubject,
        builderStore,
        this.graphs.sourceGraph
      );

      const triplesOfValidationBuilder = getTriplesWithNodeAsSubject(
        nodeSubject,
        builderStore,
        this.graphs.sourceBuilderGraph
      );
      this.updateDifferencesInTriples(
        triplesOfValidationFormNodesL,
        triplesOfValidationBuilder,
        builderStore
      );
    }

    for (const validationSubject of formNodesLValidationSubjects) {
      const statement = new Statement(
        field,
        FORM('validations'),
        validationSubject,
        this.graphs.sourceGraph
      );
      builderStore.addAll([statement]);
    }

    yield this.mergeThFieldFormsWithTheBuilderForm();
    // this.registerToObservableForStoresWithForm(); // SHOULD BE UNCOMMNETED TO PICK UP CHANGES
  }

  updateDifferencesInTriples(newTriples, oldTriples, store) {
    for (const newTriple of newTriples) {
      const matchingOldTriple = oldTriples.find(
        (triple) =>
          triple.subject.value == newTriple.subject.value &&
          triple.predicate.value == newTriple.predicate.value
      );

      if (!matchingOldTriple) continue;

      if (newTriple.object.value !== matchingOldTriple.object.value) {
        const toRemove = new Statement(
          matchingOldTriple.subject,
          matchingOldTriple.predicate,
          matchingOldTriple.object,
          this.graphs.sourceGraph
        );
        store.removeStatements([toRemove]);
      }
    }
  }

  removeValidationTriplesFromFieldThatAreRemovedFromFormNodesL(
    formNodesLValidationSubjects,
    fieldValidationNodes,
    store
  ) {
    const validationSubjectValues = formNodesLValidationSubjects.map(
      (subject) => subject.value
    );

    for (const node of fieldValidationNodes) {
      if (!validationSubjectValues.includes(node.object.value)) {
        store.removeStatements([node]);
      }
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

    this.forkingStoreManager.addFieldStores(
      storesWithForm.map((storeWithForm) => {
        return { subject: storeWithForm.subject, store: storeWithForm.store };
      })
    );

    return storesWithForm;
  }

  deregisterFromObservableForStoresWithForm(storesWithForm) {
    for (const storeWithForm of storesWithForm) {
      if (isForkingStore(storeWithForm.store)) {
        storeWithForm.store.clearObservers();
      }
    }
  }

  registerToObservableForStoresWithForm() {
    for (const storeWithForm of this.storesWithForm) {
      storeWithForm.store.registerObserver(() => {
        this.updatedFormFieldValidations.perform(storeWithForm.store);
      });
    }
  }
}
