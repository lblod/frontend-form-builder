import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { restartableTask, timeout } from 'ember-concurrency';
import { getFieldAndValidationTriples } from '../utils/get-field-and-validation-triples';
import { getValidationSubjectsOnNode } from '../utils/forking-store-helpers';
import { EXT } from '../utils/namespaces';
import { FORM } from '@lblod/submission-form-helpers';
import { Statement } from 'rdflib';
import { ForkingStore } from '@lblod/ember-submission-form-fields';
import { createBlankNodeForValidation } from '../utils/validation/create-blankNode-for-validation';

export default class FieldValidationsFormComponent extends Component {
  @tracked store;

  form;
  graphs;
  fieldSubject;

  constructor() {
    super(...arguments);

    this.fieldSubject = this.args.fieldSubject;
    this.store = this.args.store;
    this.form = this.args.form;
    this.graphs = this.args.graphs;

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
      const validationNode = createBlankNodeForValidation(
        validation,
        applyStore,
        this.graphs.sourceGraph
      );

      const statement = new Statement(
        this.fieldSubject,
        FORM('validatedBy'),
        validationNode.node,
        this.graphs.sourceGraph
      );
      validationsToApply.push(...[statement, ...validationNode.statements]);
    }

    const validationsToRemove = [];
    for (const validation of validationsOnField) {
      const statement = new Statement(
        this.fieldSubject,
        FORM('validatedBy'),
        validation,
        this.graphs.sourceGraph
      );
      validationsToRemove.push(statement);
    }

    applyStore.removeMatches(
      EXT('formNodesL'),
      FORM('validatedBy'),
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
}
