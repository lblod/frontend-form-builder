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

    for (const storeWithForm of this.storesWithForm) {
      storeWithForm.store.clearObservers();

      if (
        areValidationsInGraphValidated(
          storeWithForm.store,
          this.graphs.sourceGraph
        )
      ) {
        const final = new ForkingStore();
        parseStoreGraphs(final, templatePrefixes);

        const triples = this.getFieldAndValidationTriples(storeWithForm.store);
        final.addAll(triples);

        const builderStore = new ForkingStore();
        await parseStoreGraphs(builderStore, this.savedBuilderTtlCode);

        const allMatches = builderStore.match(
          undefined,
          undefined,
          undefined,
          this.graphs.sourceGraph
        );

        const notFieldTriples = allMatches.filter(
          (triple) => triple.subject.value !== storeWithForm.subject.value
        );
        final.addAll(notFieldTriples);

        const sourceTtl = final.serializeDataMergedGraph(
          this.graphs.sourceGraph
        );
        this.savedBuilderTtlCode = sourceTtl;
      }
    }
    this.args.onUpdateValidations(this.savedBuilderTtlCode);
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

    for (const validation of formNodesLValidations) {
      validation.subject = field;
      builderStore.addAll([validation]);
    }

    builderStore.registerObserver(() => {
      this.serializeToTtlCode(builderStore);
    });
    //#endregion
  }

  getFormNodesLValidations(store) {
    return store.match(
      EXT('formNodesL'),
      FORM('validations'),
      undefined,
      this.graphs.sourceGraph
    );
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
