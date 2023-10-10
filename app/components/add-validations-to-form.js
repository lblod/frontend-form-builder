import Component from '@glimmer/component';

import { tracked } from '@glimmer/tracking';
import { task } from 'ember-concurrency';
import { GRAPHS } from '../controllers/formbuilder/edit';
import { ForkingStore } from '@lblod/ember-submission-form-fields';
import { getLocalFileContentAsText } from '../utils/get-local-file-content';
import { FORM, RDF, EMBER, SH, EXT } from '../utils/rdflib';
import { sym as RDFNode } from 'rdflib';
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

    this.initialise.perform({ ttlCode: this.args.builderTtlCode });
  }

  @task({ restartable: false })
  *initialise({ ttlCode }) {
    const builderStore = new ForkingStore();
    yield this.parseStoreGraphs(builderStore, ttlCode);

    this.storesWithForm = yield this.createSeparateStorePerField(builderStore);
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

    const field = this.getFirstFieldSubject(builderStore);
    //#region Stop the observing to block of an infinte loop if `serializeToTtlCode`
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

    builderStore.parse(
      this.savedBuilderTtlCode,
      this.graphs.sourceBuilderGraph,
      'text/turtle'
    );

    const sourceTtl = builderStore.serializeDataMergedGraph(
      this.graphs.sourceGraph
    );

    console.log('source', sourceTtl);

    if (areValidationsInGraphValidated(builderStore, this.graphs.sourceGraph)) {
      this.args.onUpdateValidations(sourceTtl);
    }
  }

  getFirstFieldSubject(store) {
    return store.any(
      undefined,
      RDF('type'),
      FORM('Field'),
      this.graphs.sourceGraph
    );
  }

  getFormNodesLValidations(store) {
    return store.match(
      EXT('formNodesL'),
      FORM('validations'),
      undefined,
      this.graphs.sourceGraph
    );
  }

  getFieldValidationNodes(subject, store) {
    return store.match(
      subject,
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
      fieldStore.parse(something, this.graphs.sourceGraph, 'text/turtle');

      const ttl = fieldStore.serializeDataMergedGraph(this.graphs.sourceGraph);
      await this.parseStoreGraphs(fieldStore, ttl);

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

      const fieldValidations = this.getFieldValidationNodes(
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

const something = `@prefix form: <http://lblod.data.gift/vocabularies/forms/> .
@prefix sh: <http://www.w3.org/ns/shacl#> .
@prefix mu: <http://mu.semte.ch/vocabularies/core/> .
@prefix displayTypes: <http://lblod.data.gift/display-types/> .
@prefix ext: <http://mu.semte.ch/vocabularies/ext/> .
@prefix schema: <http://schema.org/> .
@prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .
@prefix nie: <http://www.semanticdesktop.org/ontologies/2007/01/19/nie#> .
@prefix fieldGroups: <http://data.lblod.info/field-groups/> .
@prefix fields: <http://data.lblod.info/fields/> .
@prefix concept: <http://lblod.data.gift/concept-schemes/> .

##########################################################
# Form
##########################################################
ext:form a form:Form, form:TopLevelForm ;
  form:includes ext:formNodesL .

##########################################################
#  Property-groups
##########################################################
ext:formFieldPg a form:PropertyGroup;
  sh:name "" ;
  sh:order 1 .`;
