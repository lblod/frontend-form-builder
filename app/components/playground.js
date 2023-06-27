import Component from '@glimmer/component';
import { inject as service } from '@ember/service';
import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';

import { sym as RDFNode } from 'rdflib';
import { FORM, RDF } from '../utils/rdflib';
import { trackedFunction } from 'ember-resources/util/function';
import { ForkingStore } from '@lblod/ember-submission-form-fields';
import { task } from 'ember-concurrency';

export const TEXT_AREA = {
  id: 'playground-text-area',
};

export default class Playground extends Component {
  @service store;
  @service router;
  textarea = TEXT_AREA;

  @service('meta-data-extractor') meta;

  @tracked formLabel = this.args.model.label;
  @tracked formComment = this.args.model.comment;
  @tracked saved = false;
  @tracked error = false;
  @tracked currentView = 'VISUAL';
  @tracked metaStore;
  @tracked metaForm;

  get graphs() {
    return this.args.graphs;
  }

  constructor() {
    super(...arguments);

    this.args.refresh.perform();
    this.refreshMeta.perform();
  }

  @task
  *refreshMeta(value) {
    let formRes = yield fetch(`/forms/form.ttl`);
    let formTtl = yield formRes.text();

    let metaRes = yield fetch(`/forms/meta.ttl`);
    let metaTtl = yield metaRes.text();

    this.metaStore = new ForkingStore();

    this.metaStore.parse(formTtl, this.graphs.formGraph, 'text/turtle');
    this.metaStore.parse(metaTtl, this.graphs.metaGraph, 'text/turtle');
    this.metaStore.parse(
      this.args.code,
      this.graphs.sourceGraph,
      'text/turtle'
    );

    this.metaForm = this.metaStore.any(
      undefined,
      RDF('type'),
      FORM('Form'),
      this.graphs.formGraph
    );

    const sourceTtl = this.metaStore.serializeDataMergedGraph(
      this.graphs.sourceGraph
    );

    this.args.refresh.perform(sourceTtl);
  }

  get form() {
    return this.args.store.any(
      undefined,
      RDF('type'),
      FORM('Form'),
      this.graphs.formGraph
    );
  }

  @action
  saveLocally() {
    // Create a link
    let downloadLink = document.createElement('a');
    downloadLink.download = this.formLabel;

    // generate Blob where file content will exists
    let blob = new Blob([this.args.template], { type: 'text/plain' });
    downloadLink.href = window.URL.createObjectURL(blob);

    // Click file to download then destroy link
    downloadLink.click();
    downloadLink.remove();
  }

  @action
  async deleteForm() {
    const generatedForm = this.args.model;
    const isDeleted = await generatedForm.destroyRecord();
    if (isDeleted) {
      this.router.transitionTo('index');
    }
  }

  @action
  async updateForm() {
    this.saved = false;
    this.error = false;
    const d = new Date();
    const FormattedDateTime = `${d.getDate()}/${d.getMonth()}/${d.getFullYear()}, ${d.toLocaleTimeString()}`;
    const form = await this.store.findRecord(
      'generated-form',
      this.args.model.id
    );
    form.modified = FormattedDateTime;
    form.ttlCode = this.args.template;
    form.label = this.formLabel;
    form.comment = this.formComment;

    try {
      await form.save();
      this.saved = true;
    } catch (err) {
      this.error = true;
    }
  }

  @action
  refresh() {
    console.log('refreshed');
  }

  @action
  serializeSourceToTtl() {
    const sourceTtl = this.metaStore.serializeDataMergedGraph(
      this.graphs.sourceGraph
    );
    console.log(sourceTtl);
    this.args.refresh.perform(sourceTtl);
  }
}
