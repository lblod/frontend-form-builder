import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { GRAPHS } from '../controllers/formbuilder/edit';
import { ForkingStore } from '@lblod/ember-submission-form-fields';
import { getLocalFileContentAsText } from '../utils/get-local-file-content';
import { FORM, RDF } from '../utils/rdflib';

export default class AddValidationsToFormComponent extends Component {
  @tracked builderStore;
  @tracked builderForm;
  @tracked formTtlCode;
  @tracked showRdfForm = false;
  @tracked sourceNode;

  graphs = GRAPHS;
  form_ttl_path = '/forms/validation/form.ttl';
  meta_ttl_path = '/forms/validation/meta.ttl';

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
      this.builderStore.registerObserver(() => {
        (function (builderStore) {
          const sourceTtl = builderStore.serializeDataMergedGraph(
            GRAPHS.sourceGraph
          );
          console.log('ttl code', sourceTtl);
        })(this.builderStore);
      }, 'validation_form.ttl');
    });
  }

  async createBuilderStore() {
    const builderStore = new ForkingStore();
    builderStore.parse(
      await getLocalFileContentAsText(this.form_ttl_path),
      GRAPHS.formGraph,
      'text/turtle'
    );
    builderStore.parse(
      await getLocalFileContentAsText(this.meta_ttl_path),
      GRAPHS.metaGraph,
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
