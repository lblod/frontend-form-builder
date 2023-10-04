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

    this.createBuilderStore(this.args.formTtlCode).then((builderStore) => {
      this.builderStore = builderStore;
      this.builderForm = this.builderStore.any(
        undefined,
        RDF('type'),
        FORM('Form'),
        GRAPHS.formGraph
      );

      this.builderStore.registerObserver(() => {
        this.serializeToTtlCode(this.builderStore);
      }, this.REGISTERED_VALIDATION_FORM_TTL_CODE_KEY);
    });
  }

  get canShowRdfForm() {
    return this.builderStore instanceof ForkingStore && this.builderForm;
  }

  async serializeToTtlCode(builderStore) {
    const sourceTtl = builderStore.serializeDataMergedGraph(GRAPHS.sourceGraph);

    if (areValidationsInGraphValidated(builderStore, GRAPHS.sourceGraph)) {
      this.args.onUpdateValidations(sourceTtl);
    }
  }

  async createBuilderStore(formTtlCode) {
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
    builderStore.parse(formTtlCode, GRAPHS.sourceGraph, 'text/turtle');

    return builderStore;
  }
}
