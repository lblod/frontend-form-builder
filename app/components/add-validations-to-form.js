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
    const builderStore = new ForkingStore();
    yield parseStoreGraphs(builderStore, ttlCode);

    this.storesWithForm = yield this.createSeparateStorePerField(builderStore);

    this.registerToObservableForStoresWithForm(this.storesWithForm);
  }

  async mergeFieldDataWithBuilderForm(fieldData) {
    const storeWithMergedField = await mergeFieldDataWithBuilderForm(
      fieldData,
      this.savedBuilderTtlCode,
      this.graphs
    );

    const sourceTtl = storeWithMergedField.serializeDataMergedGraph(
      this.graphs.sourceGraph
    );
    this.savedBuilderTtlCode = sourceTtl;

    this.args.onUpdateValidations(this.savedBuilderTtlCode);
  }

<<<<<<< HEAD
  getFieldDataForStoreWithForm(storeWithForm) {
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

      return {
        store: storeWithForm.store,
        subject: storeWithForm.subject,
        triples: triples,
      };
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

=======
>>>>>>> 5823ffb (refactor: not all field forms are merged everytime only when something is changed in the specific field form)
  getFieldDataForStoreWithForm(storeWithForm) {
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

      return {
        store: storeWithForm.store,
        subject: storeWithForm.subject,
        triples: triples,
      };
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

  getFieldsData(storesWithForm) {
    const fieldsData = [];

    for (const storeWithForm of storesWithForm) {
      fieldsData.push(this.getFieldDataForStoreWithForm(storeWithForm));
    }

    return fieldsData;
  }

  updatedFormFieldValidations(builderStore) {
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

    const storeWithForm = this.storesWithForm
      .filter((storeWithForm) => storeWithForm.store == builderStore)
      .shift();
    this.mergeFieldDataWithBuilderForm(
      this.getFieldDataForStoreWithForm(storeWithForm)
    );

    builderStore.registerObserver(() => {
      this.updatedFormFieldValidations(builderStore);
    });
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

    return storesWithForm;
  }

  deregisterFromObservableForStoresWithForm(storesWithForm) {
    for (const storeWithForm of storesWithForm) {
      if (isForkingStore(storeWithForm.store)) {
        storeWithForm.store.clearObservers();
      }
    }
  }

  registerToObservableForStoresWithForm(storesWithForm) {
    for (const storeWithForm of storesWithForm) {
      storeWithForm.store.registerObserver(() => {
        this.updatedFormFieldValidations(storeWithForm.store);
      });
    }
  }
}