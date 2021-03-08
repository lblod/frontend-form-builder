import Route from '@ember/routing/route';
import { GRAPHS } from '../../controllers/formbuilder/edit';
import { FORM, RDF } from '../../util/rdflib';
import { ForkingStore } from '@lblod/ember-submission-form-fields';
import { sym as RDFNode } from 'rdflib';
import { inject as service } from '@ember/service';

export default class UserTestsEditRoute extends Route {

  @service('meta-data-extractor') meta;

  async model(params) {
    const test = await this.store.findRecord('user-test', params.id, {
      include: [
        'form.ttl-code',
      ].join(',')
    });

    const graphs = GRAPHS;

    // Prepare data in forking store
    const graph = new ForkingStore();
    graph.parse(test.form.get('ttlCode'), graphs.formGraph, 'text/turtle');
    const meta = await this.meta.extract(graph, {graphs: GRAPHS});
    graph.parse(meta, graphs.metaGraph, 'text/turtle');
    // TODO
    // store.parse(content.source, graphs.sourceGraph, 'text/turtle');

    const form = graph.any(undefined, RDF('type'), FORM('Form'), GRAPHS.formGraph);
    const node = new RDFNode(test.uri);

    return {
      graphs,
      graph,
      form,
      node
    }
  }
}
