import { BlankNode, Statement } from 'rdflib';
import { ForkingStoreHelper } from '../forking-store-helper';

export function createBlankNodeForValidation(validationNode, store, graph) {
  const blankNode = new BlankNode();
  const triples = ForkingStoreHelper.getTriplesWithNodeAsSubject(
    validationNode,
    store,
    graph
  );

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
