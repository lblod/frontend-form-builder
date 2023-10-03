import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { GRAPHS } from '../controllers/formbuilder/edit';
import { ForkingStore } from '@lblod/ember-submission-form-fields';
import { getLocalFileContentAsText } from '../utils/get-local-file-content';
import { FORM, RDF } from '../utils/rdflib';
import { sym as RDFNode } from 'rdflib';
import { areValidationsInGraphValidated } from '../utils/validation-shape-validators';

export default class AddValidationsToFormComponent extends Component {
  @tracked builderStore;
  @tracked builderForm;
  @tracked formTtlCode;
  @tracked showRdfForm = false;

  graphs = {
    ...GRAPHS,
    fieldGraph: new RDFNode(`http://data.lblod.info/fieldGraph`),
  };
  REGISTERED_VALIDATION_FORM_TTL_CODE_KEY = 'validationFormTtlCode';

  constructor() {
    super(...arguments);

    if (!this.args.formTtlCode || this.args.formTtlCode == '') {
      throw `Cannot add validations to an empty form`;
    }

    this.formTtlCode = this.args.formTtlCode;

    this.createBuilderStore().then((builderStore) => {
      this.builderStore = builderStore;
      this.builderForm = this.createBuilderForm(builderStore);
      this.showRdfForm = true;
      this.builderStore.registerObserver(() => {
        this.serializeToTtlCode(builderStore);
      }, this.REGISTERED_VALIDATION_FORM_TTL_CODE_KEY);
    });
  }

  async serializeToTtlCode(builderStore) {
    const sourceTtl = builderStore.serializeDataMergedGraph(GRAPHS.sourceGraph);

    if (areValidationsInGraphValidated(builderStore, GRAPHS.sourceGraph)) {
      this.args.onUpdateValidations(sourceTtl);
    }
  }

  async createBuilderStore() {
    const builderStore = new ForkingStore();
    builderStore.parse(
      await getLocalFileContentAsText('/forms/validation/form.ttl'),
      GRAPHS.formGraph,
      'text/turtle'
    );
    builderStore.parse(
      await getLocalFileContentAsText('/forms/validation/meta.ttl'),
      GRAPHS.metaGraph,
      'text/turtle'
    );
    builderStore.parse(
      await getLocalFileContentAsText('/forms/builder/meta.ttl'),
      this.graphs.fieldGraph,
      'text/turtle'
    );
    builderStore.parse(this.formTtlCode, GRAPHS.sourceGraph, 'text/turtle');

    return builderStore;
  }

  createBuilderForm(builderStore) {
    return builderStore.any(
      undefined,
      RDF('type'),
      FORM('Form'),
      GRAPHS.formGraph
    );
  }
}
