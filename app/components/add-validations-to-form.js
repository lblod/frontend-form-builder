import Component from '@glimmer/component';

import { tracked } from '@glimmer/tracking';
import { task } from 'ember-concurrency';
import { GRAPHS } from '../controllers/formbuilder/edit';
import { ForkingStore } from '@lblod/ember-submission-form-fields';
import { getLocalFileContentAsText } from '../utils/get-local-file-content';
import { FORM, RDF } from '../utils/rdflib';
import { sym as RDFNode } from 'rdflib';
import { areValidationsInGraphValidated } from '../utils/validation-shape-validators';

export default class AddValidationsToFormComponent extends Component {
  @tracked builderStore;
  @tracked builderForm;

  graphs = {
    ...GRAPHS,
    fieldGraph: new RDFNode(`http://data.lblod.info/fieldGraph`),
  };

  constructor() {
    super(...arguments);

    if (!this.args.formTtlCode || this.args.formTtlCode == '') {
      throw `Cannot add validations to an empty form`;
    }

    this.initialise.perform({ formTtlCode: this.args.formTtlCode });
  }

  get canShowRdfForm() {
    return this.builderStore instanceof ForkingStore && this.builderForm;
  }

  @task({ restartable: false })
  *initialise({ formTtlCode }) {
    this.builderStore = yield this.createBuilderStore(formTtlCode);
    this.builderForm = this.builderStore.any(
      undefined,
      RDF('type'),
      FORM('Form'),
      this.graphs.formGraph
    );

    this.builderStore.registerObserver(() => {
      this.serializeToTtlCode(this.builderStore);
    });
  }

  willDestroy() {
    super.willDestroy(...arguments);

    this.builderStore.clearObservers();
  }

  serializeToTtlCode(builderStore) {
    const sourceTtl = builderStore.serializeDataMergedGraph(
      this.graphs.sourceGraph
    );

    if (areValidationsInGraphValidated(builderStore, this.graphs.sourceGraph)) {
      this.args.onUpdateValidations(sourceTtl);
    }
  }

  async createBuilderStore(formTtlCode) {
    const builderStore = new ForkingStore();
    builderStore.parse(
      await getLocalFileContentAsText('/forms/validation/form.ttl'),
      this.graphs.formGraph,
      'text/turtle'
    );
    builderStore.parse(
      await getLocalFileContentAsText('/forms/validation/meta.ttl'),
      this.graphs.metaGraph,
      'text/turtle'
    );
    builderStore.parse(
      await getLocalFileContentAsText('/forms/builder/meta.ttl'),
      this.graphs.fieldGraph,
      'text/turtle'
    );
    builderStore.parse(formTtlCode, this.graphs.sourceGraph, 'text/turtle');

    return builderStore;
  }
}
