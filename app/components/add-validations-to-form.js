import Component from '@glimmer/component';

import { tracked } from '@glimmer/tracking';
import { task } from 'ember-concurrency';
import { GRAPHS } from '../controllers/formbuilder/edit';
import { ForkingStore } from '@lblod/ember-submission-form-fields';
import { getLocalFileContentAsText } from '../utils/get-local-file-content';
import { FORM, RDF, EMBER, SH, EXT } from '../utils/rdflib';
import { sym as RDFNode, Statement } from 'rdflib';
import { areValidationsInGraphValidated } from '../utils/validation-shape-validators';

export default class AddValidationsToFormComponent extends Component {
  @tracked storesWithForm;
  savedBuilderTtlCode;

  graphs = {
    ...GRAPHS,
    fieldGraph: new RDFNode(`http://data.lblod.info/fieldGraph`),
    sourceBuilderGraph: new RDFNode(
      `http://data.lblod.info/sourceBuilderGraph`
    ),
  };

  constructor() {
    super(...arguments);

    if (!this.args.builderTtlCode || this.args.builderTtlCode == '') {
      throw `Cannot add validations to an empty form`;
    }
    this.storesWithForm = [];
    this.savedBuilderTtlCode = this.args.builderTtlCode;

    this.initialise.perform({
      ttlCode: this.args.builderTtlCode,
    });
  }

  getFieldSubject(store) {
    return store.any(
      undefined,
      RDF('type'),
      FORM('Field'),
      this.graphs.sourceGraph
    );
  }

  currentFieldValidationsToFormNodesL(store) {
    const fieldValidations = store.match(
      this.getFieldSubject(store),
      FORM('validations'),
      undefined,
      this.graphs.sourceGraph
    );

    const formNodesLValidations = store.match(
      EXT('formNodesL'),
      FORM('validations'),
      undefined,
      this.graphs.sourceGraph
    );

    if (formNodesLValidations.length !== fieldValidations.length) {
      store.addAll(
        fieldValidations.map((triple) => {
          return new Statement(
            EXT('formNodesL'),
            triple.predicate,
            triple.object,
            this.graphs.sourceGraph
          );
        })
      );
    }

    const sourceTtl = store.serializeDataMergedGraph(this.graphs.sourceGraph);

    return sourceTtl;
  }

  @task({ restartable: false })
  *initialise({ ttlCode }) {
    const builderStore = new ForkingStore();
    yield this.parseStoreGraphs(builderStore, ttlCode);

    ttlCode = this.currentFieldValidationsToFormNodesL(builderStore);

    this.storesWithForm = yield this.createSeparateStorePerField(
      builderStore,
      ttlCode
    );
  }

  willDestroy() {
    super.willDestroy(...arguments);

    for (const storeWithForm of this.storesWithForm) {
      storeWithForm.store.clearObservers();
    }
  }

  serializeToTtlCode(builderStore) {
    if (
      !areValidationsInGraphValidated(builderStore, this.graphs.sourceGraph)
    ) {
      return;
    }

    builderStore.parse(
      this.savedBuilderTtlCode,
      this.graphs.sourceGraph,
      'text/turtle'
    );

    const sourceTtl = builderStore.serializeDataMergedGraph(
      this.graphs.sourceGraph
    );

    if (areValidationsInGraphValidated(builderStore, this.graphs.sourceGraph)) {
      this.args.onUpdateValidations(sourceTtl);
    }
  }

  async createSeparateStorePerField(store, builderTtlCodeWithSomeExtra) {
    const triplesPerFieldInForm = this.getTriplesPerFieldInForm(store);
    const storesWithForm = [];

    for (const field of triplesPerFieldInForm) {
      const fieldStore = new ForkingStore();
      fieldStore.addAll(field.triples);

      await this.parseStoreGraphs(fieldStore, builderTtlCodeWithSomeExtra);

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
        displayType: field.displayType,
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

  async parseStoreGraphs(store, ttlCode) {
    store.parse(
      await getLocalFileContentAsText('/forms/validation/form.ttl'),
      this.graphs.formGraph,
      'text/turtle'
    );
    store.parse(
      await getLocalFileContentAsText('/forms/validation/meta.ttl'),
      this.graphs.metaGraph,
      'text/turtle'
    );
    store.parse(
      await getLocalFileContentAsText('/forms/builder/meta.ttl'),
      this.graphs.fieldGraph,
      'text/turtle'
    );
    store.parse(ttlCode, this.graphs.sourceGraph, 'text/turtle');
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

      const displayTypeTriple = fieldTriples.find(
        (triple) => triple.predicate.value == FORM('displayType').value
      );
      if (!displayTypeTriple) {
        console.info(`Could not find display type for field`, fieldSubject);
        continue;
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
          displayType: displayTypeTriple.object,
          triples: fieldTriples,
        });
      }
    }

    return triplesPerField;
  }
}
