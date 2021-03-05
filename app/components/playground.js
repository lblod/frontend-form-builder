import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { inject as service } from '@ember/service';
import { action } from '@ember/object';

import { sym as RDFNode} from 'rdflib';
import { GRAPHS } from '../controllers/formbuilder';
import { FORM, RDF } from '../util/rdflib';

const SOURCE_NODE = new RDFNode('http://frontend.poc.form.builder/sourcenode');

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
    this.args.refresh.perform();
  }

  get form() {
    return this.args.store.any(undefined, RDF('type'), FORM('Form'), GRAPHS.formGraph);
  }

  @action
  exportTTL() {
    // Create a link
    let downloadLink = document.createElement("a")
    downloadLink.download = "test.ttl"

    // generate Blob where file content will exists
    let blob = new Blob([this.args.template], {type:"text/plain"})
    downloadLink.href = window.URL.createObjectURL(blob)

    // Click file to download then destroy link
    downloadLink.click();
    downloadLink.remove();

  }
}
