import Service from '@ember/service';
import { inject as service } from '@ember/service';
import {
  ForkingStore,
  addGraphFor,
  delGraphFor,
} from '@lblod/ember-submission-form-fields';
import { serialize } from 'rdflib';
import { RDF } from '../utils/rdflib';

export default class SemanticFormService extends Service {
  @service database;
  @service('meta-data-extractor') meta;

  async source(model) {
    const query = `
CONSTRUCT {?s ?p ?o}
WHERE {
 VALUES ?s {
    <${model.uri}>
 }
 GRAPH <${sourceGraph(model)}> {
 ?s ?p ?o.
 }
}`;
    const response = await this.database.query(query, {
      format: 'text/turtle',
    });
    return await response.text();
  }

  async setup(store, options) {
    if (store === null) store = new ForkingStore();

    /* META */
    const meta = await this.meta.extract(store, { graphs: options.graphs });
    store.parse(meta, options.graphs.metaGraph, 'text/turtle');

    /* SOURCE */
    const source = await this.source(options.model);
    store.parse(source, options.graphs.sourceGraph, 'text/turtle');

    return store;
  }

  async update(store, options) {
    const additions = serialize(
      addGraphFor(options.graphs.sourceGraph),
      store.graph,
      undefined,
      'application/n-triples'
    );
    const removals = serialize(
      delGraphFor(options.graphs.sourceGraph),
      store.graph,
      undefined,
      'application/n-triples'
    );
    if (additions.length > 0)
      await this.database.update(`INSERT DATA {
  GRAPH <${sourceGraph(options.model)}> {
${additions}
  }
}`);
    if (removals.length > 0)
      await this.database.update(`DELETE DATA {
  GRAPH <${sourceGraph(options.model)}> {
${removals}
  }
}`);
  }

  async delete(store, options) {
    const statements = store.match(
      undefined,
      undefined,
      undefined,
      options.graphs.sourceGraph
    );
    if (statements.length > 0)
      await this.database.update(`
DELETE DATA {
    GRAPH <${sourceGraph(options.model)}> {
${statements
  .filter((statements) => statements.predicate.value !== RDF('type').value)
  .map((statement) => statement.toNT())
  .join('\n')}
    }
  }`);
  }
}

/* PRIVATE FUNCTIONS */
function sourceGraph(model) {
  return `http://mu.semte.ch/graphs/forms/${model.id}`;
}
