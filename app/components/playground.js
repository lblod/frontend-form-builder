import Component from '@glimmer/component';
import { inject as service } from '@ember/service';
import { action } from '@ember/object';

import { sym as RDFNode } from 'rdflib';
import { GRAPHS } from '../controllers/formbuilder/edit';
import { FORM, RDF } from '../util/rdflib';

const SOURCE_NODE = new RDFNode('http://frontend.poc.form.builder/sourcenode');

export const TEXT_AREA = {
  id: 'playground-text-area'
}

export default class Playground extends Component {
  @service store;
  textarea = TEXT_AREA;

  @service('meta-data-extractor') meta;

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
  saveLocally() {
    // Create a link
    let downloadLink = document.createElement("a")
    downloadLink.download = "test.ttl"

    // generate Blob where file content will exists
    let blob = new Blob([this.args.template], { type: "text/plain" })
    downloadLink.href = window.URL.createObjectURL(blob)

    // Click file to download then destroy link
    downloadLink.click();
    downloadLink.remove();
  }

  @action
  async uploadToDB() {
    const newForm = await this.store.createRecord('generated-form',{
      created: new Date(),
      modified: new Date(),
      label: "form123",
      comment: "a generated form entity",
      ttlCode: this.args.template
    })

    newForm.save()
    // let blob = new Blob([this.args.template], { type: "text/plain" })

    // // Create a "fake form"
    // let mockForm = new FormData();
    // mockForm.append('file', blob, "schema.ttl")

    // fetch('/files', {
    //   method: "POST",
    //   body: {
    //     file: mockForm,
    //     name: "test"
    //   },
    //   redirect: 'follow'
    // })
  }
}
