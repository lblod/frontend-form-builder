import { isBlankNode, isStatement } from 'rdflib';
import { FORM, NODES } from '../rdflib';

export function removeAllValidationsFromField(fieldUri, builderStore, graph) {
  const methodOptions = { store: builderStore, graph: graph };
  const statementsThatHaveValueOfField = builderStore.graph.statements.filter(
    (statement) => {
      return (
        statement.object.value == NODES(fieldUri.value.split('/').pop()).value
      );
    }
  );

  const existingFieldStatements = getAllStatementsForSubject(
    fieldUri,
    methodOptions
  );

  const fieldValidationSubjects = getValidationSubjectsFromFieldStatements(
    existingFieldStatements
  );

  const fieldValidationStatements = getAllStatementsForSubjects(
    fieldValidationSubjects,
    methodOptions
  );

  const statementsThatRemoveTheValidationsOnTheField = [
    ...fieldValidationStatements,
    ...fieldValidationSubjects,
  ];

  removeStatementsFromStore(
    builderStore,
    graph,
    statementsThatRemoveTheValidationsOnTheField
  );

  const otherStatementsThatAreNotRemoved = builderStore.graph.statements.filter(
    (statement) => {
      return !statementsThatRemoveTheValidationsOnTheField.includes(statement);
    }
  );

  builderStore.graph.statements = [];
  builderStore.addAll([
    ...statementsThatHaveValueOfField,
    ...getAllStatemenetsOtherThanValidations(existingFieldStatements),
    ...otherStatementsThatAreNotRemoved,
  ]);
}

function getValidationSubjectsFromFieldStatements(fieldStatements) {
  const subjects = fieldStatements.map((statement) => {
    if (statement.predicate.value == FORM('validations').value) {
      return statement.object;
    }
  });

  return subjects.filter((subject) => subject);
}

function getAllStatementsForSubjects(subjects, options) {
  const allStatements = [];
  for (const subject of subjects) {
    const statements = getAllStatementsForSubject(subject, options);
    allStatements.push(...statements);
  }

  return allStatements;
}

function getAllStatementsForSubject(subject, options) {
  return options.store.graph.statements.filter((statement) => {
    return statement.subject.value == subject.value;
  });
}

function removeStatementsFromStore(store, graph, statements) {
  for (const statement of statements) {
    if (isBlankNode(statement)) {
      console.info(
        `Blank nodes can't be removed, make sure you remove all the triples under the named node (${statement.value})`
      );
    }

    if (isStatement(statement)) {
      store.removeMatches(
        statement.subject,
        statement.predicate,
        statement.object,
        graph
      );
    }

    console.error(`Unknown type to remove found object:`, statement);
  }
}

function getAllStatemenetsOtherThanValidations(statements) {
  return statements.filter(
    (statement) => statement.predicate.value !== FORM('validations').value
  );
}
