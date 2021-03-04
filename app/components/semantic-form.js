import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';

import { sym as RDFNode, Namespace } from 'rdflib';
import { ForkingStore } from '@lblod/ember-submission-form-fields';

export const RDF = new Namespace('http://www.w3.org/1999/02/22-rdf-syntax-ns#');
export const FORM = new Namespace('http://lblod.data.gift/vocabularies/forms/');

const SOURCE_NODE = new RDFNode('http://frontend-poc-form-builder/source-node');

const GRAPHS = {
  formGraph: new RDFNode('http://data.lblod.info/form'),
  metaGraph: new RDFNode('http://data.lblod.info/metagraph'),
  sourceGraph: new RDFNode(`http://data.lblod.info/sourcegraph`),
};

export default class SemanticForm extends Component {

  @tracked store;

  constructor() {
    super(...arguments);

    // TODO

    /**
     * Statics
     */
    this.node = SOURCE_NODE;
    this.graphs = GRAPHS;

    // TODO parse the user provided form specification/configuration
    // const spec = this.args.spec || '';
    // this.store.parse(spec, this.graphs.formGraph.value, 'text/turtle');
    this.init(this.args.spec);
  }

  init(spec) {
    this.store = new ForkingStore();
    this.store.parse(spec, this.graphs.formGraph.value, 'text/turtle');
  }

  get form() {
    return this.store.any(undefined, RDF('type'), FORM('Form'), GRAPHS.formGraph);
  }

}
