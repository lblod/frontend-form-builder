import { ForkingStore } from '@lblod/ember-submission-form-fields';
import { getLocalFileContentAsText } from '../get-local-file-content-as-text';
import { CONCEPTS, EXT, FORM } from '../rdflib';
import { BlankNode, Statement } from 'rdflib';

export const VALIDATIONS = {
  isRequired: {
    name: 'RequiredConstraint',
    uuid: '629bddbb-bf30-48d6-95af-c2f406bd9e8c',
  },
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

  createValidationStatementsForField(fieldSubject, validation) {
    const fieldType = 'defaultInput';
    const isValidationPossibleForField = this.isPossibleValidationForField(
      fieldType,
      validation
    );

    if (!isValidationPossibleForField) {
      throw `Validation '${validation.name}' is not possible for field type '${fieldType}'`;
    }

    const validationStatementsForValidationBlankNode = [];
    const validationStatements = this.getValidationStatementsForName(
      validation.name
    );

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

  isPossibleValidationForField(fieldType, validation) {
    const matchesForFieldType = this.forkingStore.match(
      undefined,
      EXT('displayType'),
      fieldType,
      this.graphs.metaGraph
    );
    if (matchesForFieldType.length == 0) {
      return false;
    }

    if (matchesForFieldType.length > 1) {
      throw `Found multiple(${matchesForFieldType.length}) statements for field type '${fieldType}'`;
    }

    const fieldTypeSubject = matchesForFieldType.shift().subject;
    const possibleValidationStatements = this.forkingStore.match(
      fieldTypeSubject,
      EXT('canHaveValidation'),
      undefined,
      this.graphs.metaGraph
    );

    const possibleValidationObjects = possibleValidationStatements.map(
      (statement) => statement.object.value
    );

    return possibleValidationObjects.includes(CONCEPTS(validation.uuid).value);
  }

  getFormTtlCode() {
    return this.forkingStore.serializeDataMergedGraph(this.graphs.sourceGraph);
  }

  getValidationStatementsForName(validationName) {
    const validationNames = Object.values(VALIDATIONS).map(
      (validation) => validation.name
    );
    if (!validationNames.includes(validationName)) {
      throw `Validation with name ${validationName} is not a valid validation`;
    }

    const validationSubject = this.getValidationSubjectForValidationName(
      VALIDATIONS.isRequired.name
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
      throw `Found multiple(${statementsForValidationName.length}) statements with validation name ${validationName}`;
    }

    return statementsForValidationName.shift().subject;
  }
}
