import Component from '@glimmer/component';

import { inject as service } from '@ember/service';
import { tracked } from '@glimmer/tracking';
import { task } from 'ember-concurrency';
import { ForkingStore } from '@lblod/ember-submission-form-fields';
import { FORM, EMBER, EXT } from '../utils/rdflib';
import { areValidationsInGraphValidated } from '../utils/validation-shape-validators';
import {
  getFirstFieldSubject,
  parseStoreGraphs,
  removeUnassignedNodesFromGraph,
  validationGraphs,
} from '../utils/validation-helpers';
import { Statement, triple } from 'rdflib';
import {
  getAllTriples,
  getNodeValidationTriples,
  getTriplesWithNodeAsSubject,
  getValidationSubjectsOnNode,
} from '../utils/forking-store-helpers';
import { showErrorToasterMessage } from '../utils/toaster-message-helper';
import { getFieldsInStore } from '../utils/get-triples-per-field-in-store';
import { createStoreForFieldData } from '../utils/create-store-for-field';
import { templatePrefixes } from '../utils/validation-form-templates/template-prefixes';

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
  }

  async willDestroy() {
    super.willDestroy(...arguments);

    this.deregisterFromObservableForStoresWithForm(this.storesWithForm);

    for (const fieldData of this.getFieldsData(this.storesWithForm)) {
      const final = new ForkingStore();
      parseStoreGraphs(final, templatePrefixes);
      final.addAll(fieldData.triples);

      const builderStore = new ForkingStore();
      await parseStoreGraphs(builderStore, this.savedBuilderTtlCode);

      const validationnodesOfField = getNodeValidationTriples(
        fieldData.subject,
        builderStore,
        this.graphs.sourceGraph
      );

      builderStore.removeStatements(validationnodesOfField);
      removeUnassignedNodesFromGraph(builderStore, EMBER('source-node'));

      const allTriplesInGraph = getAllTriples(
        builderStore,
        this.graphs.sourceGraph
      );

      const notFieldTriples = allTriplesInGraph.filter(
        (triple) => triple.subject.value !== fieldData.subject.value
      );
      final.addAll(notFieldTriples);

      removeUnassignedNodesFromGraph(final, EMBER('source-node'));

      const sourceTtl = final.serializeDataMergedGraph(this.graphs.sourceGraph);
      this.savedBuilderTtlCode = sourceTtl;
    }

    this.args.onUpdateValidations(this.savedBuilderTtlCode);
  }

  deregisterFromObservableForStoresWithForm(storesWithForm) {
    for (const storeWithForm of storesWithForm) {
      storeWithForm.store.clearObservers();
    }
  }

  getFieldsData(storesWithForm) {
    const fieldsData = [];

    for (const storeWithForm of storesWithForm) {
      const isValidTtl = areValidationsInGraphValidated(
        storeWithForm.store,
        this.graphs.sourceGraph
      );
      if (isValidTtl) {
        const triples = this.getFieldAndValidationTriples(storeWithForm.store);

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

  getFieldAndValidationTriples(store) {
    const triples = [];

    const fieldSubject = getFirstFieldSubject(store);
    const fieldTriples = getTriplesWithNodeAsSubject(
      fieldSubject,
      store,
      this.graphs.sourceGraph
    );

    triples.push(...fieldTriples);
    const fieldValidationSubjects = getValidationSubjectsOnNode(
      fieldSubject,
      store,
      this.graphs.sourceGraph
    );
    for (const validationSubject of fieldValidationSubjects) {
      const validationTriples = getTriplesWithNodeAsSubject(
        validationSubject,
        store,
        this.graphs.sourceGraph
      );
      triples.push(...validationTriples);
    }

    return triples;
  }

  serializeToTtlCode(builderStore) {
    if (
      !areValidationsInGraphValidated(builderStore, this.graphs.sourceGraph)
    ) {
      return;
    }

    const field = getFirstFieldSubject(builderStore);
    //#region Stop the observing to block off an infinite loop if `serializeToTtlCode`
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

    this.removeValidationTriplesFromFieldThatAreRemovedFromFromNodesL(
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

    builderStore.registerObserver(() => {
      this.serializeToTtlCode(builderStore);
    });
    //#endregion
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

  removeValidationTriplesFromFieldThatAreRemovedFromFromNodesL(
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

  addValidationTriplesToFormNodesL(store) {
    const fieldSubject = getFirstFieldSubject(store);
    const validationSubjects = getValidationSubjectsOnNode(
      fieldSubject,
      store,
      this.graphs.sourceGraph
    );
    for (const subject of validationSubjects) {
      const validationTriples = getTriplesWithNodeAsSubject(
        subject,
        store,
        this.graphs.sourceBuilderGraph
      );
      const formNodesLWithValidation = triple(
        EXT('formNodesL'),
        FORM('validations'),
        validationTriples.shift().subject,
        this.graphs.sourceGraph
      );
      store.addAll([
        formNodesLWithValidation,
        ...validationTriples.map((triple) => {
          triple.graph = this.graphs.sourceGraph;
          return triple;
        }),
      ]);
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

      this.addValidationTriplesToFormNodesL(fieldStoreWithForm.store);

      fieldStoreWithForm.store.registerObserver(() => {
        this.serializeToTtlCode(fieldStoreWithForm.store);
      });

      storesWithForm.push(fieldStoreWithForm);
    }

    return storesWithForm;
  }
}
