import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { restartableTask, timeout } from 'ember-concurrency';
import { getFieldAndValidationTriples } from '../utils/get-field-and-validation-triples';
import {
  getTriplesWithNodeAsSubject,
  getValidationSubjectsOnNode,
} from '../utils/forking-store-helpers';
import { EXT, FORM } from '../utils/rdflib';
import { BlankNode, Statement } from 'rdflib';
import { ForkingStore } from '@lblod/ember-submission-form-fields';

export default class FieldValidationsFormComponent extends Component {
  @tracked store;

  form;
  graphs;
  fieldSubject;

  fieldAndValidationTriples = [];

  constructor() {
    super(...arguments);

    this.fieldSubject = this.args.fieldSubject;
    this.store = this.args.store;
    this.form = this.args.form;
    this.graphs = this.args.graphs;

    this.fieldAndValidationTriples = getFieldAndValidationTriples(
      this.fieldSubject,
      this.store,
      this.graphs.sourceGraph
    );

    this.store.registerObserver(() => {
      this.updateFieldForm.perform();
    });
  }

  updateFieldForm = restartableTask(async () => {
    await timeout(1);

    const triples = this.getTriplesWithAppliedChanges();
    this.fieldAndValidationTriples = triples;

    this.args.updateTtlCodeWithField({
      fieldSubject: this.fieldSubject,
      triples: triples,
    });
  });

  getTriplesWithAppliedChanges() {
    const fieldTtl = this.store.serializeDataMergedGraph(
      this.graphs.sourceGraph
    );
    console.log(`field ttl`, fieldTtl);
    const applyStore = new ForkingStore();
    applyStore.parse(fieldTtl, this.graphs.sourceGraph, 'text/turtle');

    const validationsOnField = getValidationSubjectsOnNode(
      this.fieldSubject,
      applyStore,
      this.graphs.sourceGraph
    );
    const validations = getValidationSubjectsOnNode(
      EXT('formNodesL'),
      applyStore,
      this.graphs.sourceGraph
    );

    const validationsToApply = [];
    for (const validation of validations) {
      const validationNode = this.createBlankNodeForValidation(
        validation,
        applyStore
      );
      const statement = new Statement(
        this.fieldSubject,
        FORM('validations'),
        validationNode,
        this.graphs.sourceGraph
      );
      validationsToApply.push(statement);
    }

    const validationsToRemove = [];
    for (const validation of validationsOnField) {
      const statement = new Statement(
        this.fieldSubject,
        FORM('validations'),
        validation,
        this.graphs.sourceGraph
      );
      validationsToRemove.push(statement);
    }

    applyStore.removeMatches(
      EXT('formNodesL'),
      FORM('validations'),
      undefined,
      this.graphs.sourceGraph
    );

    applyStore.removeStatements(validationsToRemove);
    applyStore.addAll(validationsToApply);

    return getFieldAndValidationTriples(
      this.fieldSubject,
      applyStore,
      this.graphs.sourceGraph
    );
  }

  createBlankNodeForValidation(validationNode, store) {
    const blankNode = new BlankNode();
    const triples = getTriplesWithNodeAsSubject(
      validationNode,
      store,
      this.graphs.sourceGraph
    );

    const blankNodeStatements = [];
    for (const triple of triples) {
      const statement = new Statement(
        blankNode,
        triple.predicate,
        triple.object,
        this.graphs.sourceGraph
      );
      blankNodeStatements.push(statement);
    }
    store.addAll(blankNodeStatements);

    return blankNode;
  }
}
