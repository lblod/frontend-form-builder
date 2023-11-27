import { BlankNode, Statement } from 'rdflib';
import { getTriplesWithNodeAsSubject } from '../forking-store-helpers';

export function createBlankNodeForValidation(validationNode, store, graph) {
  const blankNode = new BlankNode();
  const triples = getTriplesWithNodeAsSubject(validationNode, store, graph);

  const blankNodeStatements = [];
  for (const triple of triples) {
    const statement = new Statement(
      blankNode,
      triple.predicate,
      triple.object,
      graph
    );
    blankNodeStatements.push(statement);
  }

  return { node: blankNode, statements: blankNodeStatements };
}
