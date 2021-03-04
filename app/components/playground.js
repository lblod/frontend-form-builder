import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { inject as service } from '@ember/service';
import { task } from 'ember-concurrency-decorators';
import { action } from '@ember/object';

import { sym as RDFNode, Namespace } from 'rdflib';
import { ForkingStore } from '@lblod/ember-submission-form-fields';
export const RDF = new Namespace('http://www.w3.org/1999/02/22-rdf-syntax-ns#');
export const FORM = new Namespace('http://lblod.data.gift/vocabularies/forms/');

const SOURCE_NODE = new RDFNode('http://frontend.poc.form.builder/sourcenode');

const GRAPHS = {
  formGraph: new RDFNode('http://data.lblod.info/form'),
  metaGraph: new RDFNode('http://data.lblod.info/metagraph'),
  sourceGraph: new RDFNode(`http://data.lblod.info/sourcegraph`),
};

export default class Playground extends Component {

  @service('meta-data-extractor') meta;

  @tracked store;

  constructor() {
    super(...arguments);

    /**
     * Statics
     */
    this.node = SOURCE_NODE;
    this.graphs = GRAPHS;
    this.specification = this.args.template;
    this.init.perform(this.specification);
  }

  @task
  * init(specification) {
    this.store = new ForkingStore();
    this.store.parse(specification, this.graphs.formGraph.value, 'text/turtle');
    const meta = yield this.meta.extract(this.store, {graphs: this.graphs});
    this.store.parse(meta, this.graphs.metaGraph.value, 'text/turtle');
  }

  get form() {
    return this.store.any(undefined, RDF('type'), FORM('Form'), GRAPHS.formGraph);
  }

  @action
  exportTTL() {
    // Create a link
    let downloadLink = document.createElement("a")
    downloadLink.download = "test.ttl"

    // generate Blob where file content will exists
    let blob = new Blob([this.specification], {type:"text/plain"})
    downloadLink.href = window.URL.createObjectURL(blob)

    // Click file to download then destroy link
    downloadLink.click();
    downloadLink.remove();

  }
}
