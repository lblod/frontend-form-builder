import Service from '@ember/service';
import { inject as service } from '@ember/service';
import { ForkingStore } from '@lblod/ember-submission-form-fields';
import { serialize } from 'rdflib';

export default class SemanticFormService extends Service {

  @service database;
  @service('meta-data-extractor') meta;

  async setup(form, store, options) {
    if (store === null)
      store = new ForkingStore();

    /* META */
    const meta = await this.meta.extract(store, {graphs: options.graphs});
    store.parse(meta, options.graphs.metaGraph, 'text/turtle');

    /* SOURCE */
    const source = await this.source(form);
    store.parse(source, options.graphs.sourceGraph, 'text/turtle');

    return store;
  }

  async source(form) {
    const query = `
CONSTRUCT {?s ?p ?o}
WHERE {
 VALUES ?s {
    <${form.uri}>
 }
 ?s ?p ?o.
}`;
    const response = await this.database.query(query, {format: 'text/turtle'});
    return await response.text();
  }

  async update(form, store, options) {
    // TODO for now the graph is hardcoded
    await this.database.update(`DELETE {
  GRAPH ?g {
   ?s ?p ?o .
  }
}
WHERE {
  GRAPH ?g {
   VALUES ?s {
      <${form.uri}>
   }
   ?s ?p ?o .
  }
}`);
    const ttl = await serialize(options.graphs.sourceGraph, store, undefined, 'application/n-triples');
    await this.database.update(`INSERT DATA {
  GRAPH <http://mu.semte.ch/application> {
${ttl}
  }
  }`);
  }

  async delete(store, options) {
    /* DELETING SOURCE */
    const statements = store.match(undefined, undefined, undefined, options.graphs.sourceGraph);
    if (statements.length > 0) {
      // TODO for now the graph is hardcoded
      await this.database.update(`
DELETE DATA {
    GRAPH <http://mu.semte.ch/application> {
${statements.map(statement => statement.toNT()).join('\n')}
    }
  }`);
    }
  }
}
