import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { GRAPHS } from '../controllers/formbuilder/edit';
import { ForkingStore } from '@lblod/ember-submission-form-fields';
import { getLocalFileContentAsText } from '../utils/get-local-file-content';
import { FORM, RDF } from '../utils/rdflib';
import { inject as service } from '@ember/service';

export default class AddValidationsToFormComponent extends Component {
  @service('meta-data-extractor') meta;

  @tracked builderStore;
  @tracked builderForm;
  @tracked formTtlCode;
  @tracked showRdfForm = false;
  @tracked sourceNode;

  graphs = GRAPHS;
  validation_ttl_path = '/forms/validation.ttl';

  constructor() {
    super(...arguments);

    if (!this.args.formTtlCode || this.args.formTtlCode == '') {
      throw `Cannot add validations to an empty form`;
    }

    this.formTtlCode = this.args.formTtlCode;
    this.sourceNode = this.args.sourceNode;

    this.createBuilderStore().then((builderStore) => {
      this.builderStore = builderStore;
      this.builderForm = this.createBuilderForm(builderStore);
      this.showRdfForm = true;
    });
  }

  async createBuilderStore() {
    const builderStore = new ForkingStore();
    builderStore.parse(
      await getLocalFileContentAsText(this.validation_ttl_path),
      GRAPHS.formGraph,
      'text/turtle'
    );
    const meta = await this.meta.extract(builderStore, { graphs: GRAPHS });
    builderStore.parse(meta, GRAPHS.metaGraph, 'text/turtle');
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
