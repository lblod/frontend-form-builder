import Component from '@glimmer/component';

import { tracked } from '@glimmer/tracking';
import { task } from 'ember-concurrency';
import { ForkingStore } from '@lblod/ember-submission-form-fields';
import { FORM, RDF, EMBER, SH, EXT } from '../utils/rdflib';
import { areValidationsInGraphValidated } from '../utils/validation-shape-validators';
import {
  getFirstFieldSubject,
  getValidationNodesForSubject,
  parseStoreGraphs,
  removeUnassignedNodes,
  templateForValidationOnField,
  templatePrefixes,
  validationGraphs,
} from '../utils/validation-helpers';
import { triple } from 'rdflib';

export default class AddValidationsToFormComponent extends Component {
  @tracked storesWithForm;
  savedBuilderTtlCode;

  graphs = validationGraphs;

  constructor() {
    super(...arguments);

    if (!this.args.builderTtlCode || this.args.builderTtlCode == '') {
      throw `Cannot add validations to an empty form`;
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

      const allMatches = builderStore.match(
        undefined,
        undefined,
        undefined,
        this.graphs.sourceGraph
      );

      const notFieldTriples = allMatches.filter(
        (triple) => triple.subject.value !== fieldData.subject.value
      );
      final.addAll(notFieldTriples);

      removeUnassignedNodes(final, EMBER('source-node'));

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
        console.info(
          `Form of field with id: ${storeWithForm.subject} is invalid`
        );
        console.info(
          `current field ttl`,
          storeWithForm.store.serializeDataMergedGraph(this.graphs.sourceGraph)
        );
      }
    }

    return fieldsData;
  }

  getFieldAndValidationTriples(store) {
    const triples = [];

    const fieldSubject = getFirstFieldSubject(store);
    const fieldTriples = store.match(
      fieldSubject,
      undefined,
      undefined,
      this.graphs.sourceGraph
    );
    triples.push(...fieldTriples);
    const fieldValidationSubjects = getValidationNodesForSubject(
      fieldSubject,
      store
    ).map((triple) => triple.object);
    for (const validationSubject of fieldValidationSubjects) {
      const validationTriples = store.match(
        validationSubject,
        undefined,
        undefined,
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
    const formNodesLValidations = this.getFormNodesLValidations(builderStore);
    const fieldValidations = getValidationNodesForSubject(field, builderStore);

    this.removeValidationTriplesFromFieldThatAreRemovedFromFromNodesL(
      formNodesLValidations,
      fieldValidations,
      builderStore
    );

    for (const validation of formNodesLValidations) {
      validation.subject = field;
      builderStore.addAll([validation]);
    }

    builderStore.registerObserver(() => {
      this.serializeToTtlCode(builderStore);
    });
    //#endregion
  }

  removeValidationTriplesFromFieldThatAreRemovedFromFromNodesL(
    formNodesLValidations,
    fieldValidations,
    store
  ) {
    const formNodesLObjects = formNodesLValidations.map(
      (statement) => statement.object.value
    );

    for (const fieldValidation of fieldValidations) {
      if (!formNodesLObjects.includes(fieldValidation.object.value)) {
        store.removeStatements([fieldValidation]);
      }
    }
  }

  getFormNodesLValidations(store) {
    return store.match(
      EXT('formNodesL'),
      FORM('validations'),
      undefined,
      this.graphs.sourceGraph
    );
  }

  addValidationTriplesToFormNodesL(store) {
    const fieldSubject = getFirstFieldSubject(store);
    const validationSubjects = getValidationNodesForSubject(
      fieldSubject,
      store
    ).map((triple) => triple.object);
    for (const subject of validationSubjects) {
      const validationTriples = store.match(
        subject,
        undefined,
        undefined,
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
      throw `No fields found in form.`;
    }

    const triplesPerField = [];

    for (const fieldSubject of possibleFieldSubjects) {
      const fieldTriples = store.match(
        fieldSubject,
        undefined,
        undefined,
        this.graphs.sourceGraph
      );

      const fieldValidations = getValidationNodesForSubject(
        fieldSubject,
        store
      );
      for (const node of fieldValidations) {
        const validationTriples = store.match(
          node.object,
          undefined,
          undefined,
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
