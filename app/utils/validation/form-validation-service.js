import { ForkingStore } from '@lblod/ember-submission-form-fields';
import { getLocalFileContentAsText } from '../get-local-file-content-as-text';
import { FORM } from '../rdflib';
import { BlankNode, Statement } from 'rdflib';

export const VALIDATIONS = {
  isRequired: 'RequiredConstraint',
};

export default class FormValidationService {
  constructor(forkingStore, graphs) {
    this.forkingStore = forkingStore;
    this.graphs = graphs;
  }

  static async init(formTurtleCode, formTtl, metaTtl, graphs) {
    const validationTtlAsText = await getLocalFileContentAsText(
      '/forms/validation.ttl'
    );

    const store = new ForkingStore(graphs.sourceGraph);
    store.parse(formTtl, graphs.formGraph.value, 'text/turtle');
    store.parse(metaTtl, graphs.metaGraph.value, 'text/turtle');
    store.parse(
      validationTtlAsText,
      graphs.validationGraph.value,
      'text/turtle'
    );
    store.parse(formTurtleCode, graphs.sourceGraph.value, 'text/turtle');

    return new this(store, graphs);
  }

  createValidationStatementsForField(fieldSubject, validationName) {
    const validationStatementsForValidationBlankNode = [];
    const validationStatements =
      this.getValidationStatementsForName(validationName);

    const validationBlankNode = new BlankNode();
    const validationsForField = new Statement(
      fieldSubject,
      FORM('validations'),
      validationBlankNode,
      this.graphs.sourceGraph
    );

    for (const validationStatement of validationStatements) {
      const statementForValidation = new Statement(
        validationBlankNode,
        validationStatement.predicate,
        validationStatement.object,
        this.graphs.sourceGraph
      );
      validationStatementsForValidationBlankNode.push(statementForValidation);
    }

    return [validationsForField, ...validationStatementsForValidationBlankNode];
  }

  getFormTtlCode() {
    return this.forkingStore.serializeDataMergedGraph(this.graphs.sourceGraph);
  }

  getValidationStatementsForName(validationName) {
    if (!Object.values(VALIDATIONS).includes(validationName)) {
      throw `Validation with name ${validationName} is not a valid validation`;
    }

    const validationSubject = this.getValidationSubjectForValidationName(
      VALIDATIONS.isRequired
    );
    const statementsForValidation = this.forkingStore.match(
      validationSubject,
      undefined,
      undefined,
      this.graphs.validationGraph
    );

    return statementsForValidation;
  }

  getValidationSubjectForValidationName(validationName) {
    const statementsForValidationName = this.forkingStore.match(
      undefined,
      undefined,
      FORM(validationName),
      this.graphs.validationGraph
    );

    if (statementsForValidationName.length == 0) {
      throw `Could not find statements with validation name ${validationName}`;
    }

    if (statementsForValidationName.length > 1) {
      throw `Found multiple statements with validation name ${validationName}`;
    }

    return statementsForValidationName.shift().subject;
  }
}
