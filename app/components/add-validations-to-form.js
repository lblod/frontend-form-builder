import Component from '@glimmer/component';

import { inject as service } from '@ember/service';
import { tracked } from '@glimmer/tracking';
import { task } from 'ember-concurrency';
import { ForkingStore } from '@lblod/ember-submission-form-fields';
import { FORM, RDF, EMBER, SH, EXT } from '../utils/rdflib';
import { areValidationsInGraphValidated } from '../utils/validation-shape-validators';
import {
  getFirstFieldSubject,
  parseStoreGraphs,
  removeUnassignedNodesFromGraph,
  templateForValidationOnField,
  templatePrefixes,
  validationGraphs,
} from '../utils/validation-helpers';
import { Statement, triple } from 'rdflib';
import {
  getAllTriples,
  getNodeValidationTriples,
  getTriplesOfSubject,
  getValidationSubjectsOnNode,
} from '../utils/forking-store-helpers';
import { showErrorToasterMessage } from '../utils/toaster-message-helper';

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

  removeValidationsFromBuilderFields(fieldSubject, store) {
    const fieldValidationSubjects = getValidationSubjectsOnNode(
      fieldSubject,
      store,
      this.graphs.sourceGraph
    );

    for (const validationSubject of fieldValidationSubjects) {
      const validationTriples = getTriplesOfSubject(
        validationSubject,
        store,
        this.graphs.sourceBuilderGraph
      );

      store.removeStatements(validationTriples);
    }
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
    const fieldTriples = getTriplesOfSubject(
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
      const validationTriples = getTriplesOfSubject(
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
      const triplesOfValidationFormNodesL = getTriplesOfSubject(
        nodeSubject,
        builderStore,
        this.graphs.sourceGraph
      );

      const triplesOfValidationBuilder = getTriplesOfSubject(
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
      const validationTriples = getTriplesOfSubject(
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
    const triplesPerFieldInForm = this.getTriplesPerFieldInForm(store);
    const storesWithForm = [];

    for (const field of triplesPerFieldInForm) {
      const fieldStore = new ForkingStore();
      fieldStore.addAll(field.triples);
      fieldStore.parse(
        templateForValidationOnField,
        this.graphs.sourceGraph,
        'text/turtle'
      );

      const ttl = fieldStore.serializeDataMergedGraph(this.graphs.sourceGraph);
      await parseStoreGraphs(fieldStore, ttl);

      fieldStore.parse(
        this.savedBuilderTtlCode,
        this.graphs.sourceBuilderGraph,
        'text/turtle'
      );

      this.addValidationTriplesToFormNodesL(fieldStore);

      fieldStore.registerObserver(() => {
        this.serializeToTtlCode(fieldStore);
      });

      storesWithForm.push({
        name: field.name,
        subject: field.subject,
        store: fieldStore,
        form: fieldStore.any(
          undefined,
          RDF('type'),
          FORM('Form'),
          this.graphs.formGraph
        ),
      });
    }

    return storesWithForm;
  }

  getTriplesPerFieldInForm(store) {
    const possibleFieldSubjects = store
      .match(
        EMBER('source-node'),
        FORM('includes'),
        undefined,
        this.graphs.sourceGraph
      )
      .map((triple) => triple.object);

    if (possibleFieldSubjects.length == 0) {
      const errorMessage = `No fields found in form.`;
      showErrorToasterMessage(this.toaster, errorMessage);

      throw errorMessage;
    }

    const triplesPerField = [];

    for (const fieldSubject of possibleFieldSubjects) {
      const fieldTriples = getTriplesOfSubject(
        fieldSubject,
        store,
        this.graphs.sourceGraph
      );

      const fieldValidationSubjects = getValidationSubjectsOnNode(
        fieldSubject,
        store,
        this.graphs.sourceGraph
      );
      for (const subject of fieldValidationSubjects) {
        const validationTriples = getTriplesOfSubject(
          subject,
          store,
          this.graphs.sourceGraph
        );

        fieldTriples.push(...validationTriples);
      }

      let fieldName = 'Text field';
      const fieldNameTriple = fieldTriples.find(
        (triple) => triple.predicate.value == SH('name').value
      );
      if (fieldNameTriple) {
        fieldName = fieldNameTriple.object.value;
      }

      const tripleIsField = fieldTriples.find(
        (triple) => triple.object.value == FORM('Field').value
      );
      if (tripleIsField) {
        triplesPerField.push({
          subject: fieldSubject,
          name: fieldName,
          triples: fieldTriples,
        });
      }
    }

    return triplesPerField;
  }
}
