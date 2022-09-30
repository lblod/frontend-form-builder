import Route from '@ember/routing/route';
import { GRAPHS } from '../../controllers/formbuilder/edit';
import { FORM, RDF } from '../../util/rdflib';
import { ForkingStore } from '@lblod/ember-submission-form-fields';
import { sym as RDFNode } from 'rdflib';
import { inject as service } from '@ember/service';

export default class UserTestsEditRoute extends Route {
  @service semanticForm;
  @service('meta-data-extractor') meta;

  async model(params) {
    const test = await this.store.findRecord('user-test', params.id, {
      include: 'form',
    });

    const graphs = GRAPHS;

    // Prepare data in forking store
    let graph = new ForkingStore();
    const testForm = await test.form;
    graph.parse(testForm.ttlCode, graphs.formGraph, 'text/turtle');
    graph = await this.semanticForm.setup(graph, { graphs, model: test });
    const form = graph.any(
      undefined,
      RDF('type'),
      FORM('Form'),
      GRAPHS.formGraph
    );
    const node = new RDFNode(test.uri);

    return {
      graphs,
      graph,
      form,
      node,
      test,
    };
  }
}
