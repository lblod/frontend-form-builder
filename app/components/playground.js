import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
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
  @service router;
  textarea = TEXT_AREA;

  @service('meta-data-extractor') meta;

  @tracked formLabel;
  @tracked formComment;

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
  async deleteForm() {
    const generatedForm = this.args.model
    const isDeleted = await generatedForm.destroyRecord()
    if(isDeleted) {
      this.router.transitionTo('index')
    }
  }

  @action
  async updateForm() {
    const d = new Date();
    const FormattedDateTime = `${d.getDate()}/${d.getMonth()}/${d.getFullYear()}, ${d.toLocaleTimeString()}` ;
    const modifiedForm = await this.store.findRecord('generated-form', this.args.model.id).then((form) => {
      form.modified = FormattedDateTime;
      form.ttlCode = this.args.template;
      form.label = this.formLabel;
      form.comment = this.formComment;
     })

    modifiedForm.save()
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
