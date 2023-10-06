import Component from '@glimmer/component';

import { tracked } from '@glimmer/tracking';
import { task } from 'ember-concurrency';
import { GRAPHS } from '../controllers/formbuilder/edit';
import { ForkingStore } from '@lblod/ember-submission-form-fields';
import { getLocalFileContentAsText } from '../utils/get-local-file-content';
import { FORM, RDF, EMBER, SH } from '../utils/rdflib';
import { sym as RDFNode } from 'rdflib';
import { areValidationsInGraphValidated } from '../utils/validation-shape-validators';

export default class AddValidationsToFormComponent extends Component {
  @tracked builderStore;
  @tracked builderForm;
  @tracked storesWithForm;

  graphs = {
    ...GRAPHS,
    fieldGraph: new RDFNode(`http://data.lblod.info/fieldGraph`),
  };

  constructor() {
    super(...arguments);

    if (!this.args.formTtlCode || this.args.formTtlCode == '') {
      throw `Cannot add validations to an empty form`;
    }
    this.storesWithForm = [];

    this.initialise.perform({ formTtlCode: this.args.formTtlCode });
  }

  get canShowRdfForm() {
    return this.builderStore instanceof ForkingStore && this.builderForm;
  }

  @task({ restartable: false })
  *initialise({ formTtlCode }) {
    this.builderStore = yield this.createBuilderStore(formTtlCode);
    this.builderForm = this.builderStore.any(
      undefined,
      RDF('type'),
      FORM('Form'),
      this.graphs.formGraph
    );

    // this.builderStore.registerObserver(() => {
    //   this.serializeToTtlCode(this.builderStore);
    // });
  }

  willDestroy() {
    super.willDestroy(...arguments);

    this.builderStore.clearObservers();
  }

  serializeToTtlCode(builderStore) {
    const sourceTtl = builderStore.serializeDataMergedGraph(
      this.graphs.sourceGraph
    );

    if (areValidationsInGraphValidated(builderStore, this.graphs.sourceGraph)) {
      this.args.onUpdateValidations(sourceTtl);
    }
  }

  async createBuilderStore(formTtlCode) {
    const builderStore = new ForkingStore();
    builderStore.parse(
      await getLocalFileContentAsText('/forms/validation/form.ttl'),
      this.graphs.formGraph,
      'text/turtle'
    );
    builderStore.parse(
      await getLocalFileContentAsText('/forms/validation/meta.ttl'),
      this.graphs.metaGraph,
      'text/turtle'
    );
    builderStore.parse(
      await getLocalFileContentAsText('/forms/builder/meta.ttl'),
      this.graphs.fieldGraph,
      'text/turtle'
    );
    builderStore.parse(formTtlCode, this.graphs.sourceGraph, 'text/turtle');

    this.storesWithForm = await this.createSeparateStorePerField(builderStore);

    console.log('storesWithForm', this.storesWithForm);

    return builderStore;
  }

  async createSeparateStorePerField(store) {
    const triplesPerFieldInForm = this.getTriplesPerFieldInForm(store);
    const storesWithForm = [];

    for (const field of triplesPerFieldInForm) {
      const fieldStore = new ForkingStore();
      fieldStore.addAll(field.triples);

      const ttl = fieldStore.serializeDataMergedGraph(this.graphs.sourceGraph);
      fieldStore.parse(something, this.graphs.sourceGraph, 'text/turtle');

      await this.parseStoreGraphs(fieldStore, ttl);

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
        throw `Could not find display type for field`;
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
