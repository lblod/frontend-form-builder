import { Literal, NamedNode, Statement } from 'rdflib';
import { GRAPHS } from '../../controllers/formbuilder/edit';
import { RDF, SKOS } from '../rdflib';

export function conceptAsStatements(model, conceptSchemeSubject) {
  const subject = new NamedNode(model.uri);

  return [
    new Statement(subject, RDF('type'), SKOS('Concept'), GRAPHS.sourceGraph),
    new Statement(
      subject,
      SKOS('inScheme'),
      conceptSchemeSubject,
      GRAPHS.sourceGraph
    ),
    new Statement(
      subject,
      SKOS('prefLabel'),
      new Literal(model.label),
      GRAPHS.sourceGraph
    ),
  ];
}
