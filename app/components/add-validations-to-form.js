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
  REGISTERED_VALIDATION_FORM_TTL_CODE_KEY = 'validationFormTtlCode';

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
        this.serializeToTtlCode(builderStore);
      }, this.REGISTERED_VALIDATION_FORM_TTL_CODE_KEY);
    });
  }

  async serializeToTtlCode(builderStore) {
    const sourceTtl = builderStore.serializeDataMergedGraph(GRAPHS.sourceGraph);

    const subjectThatHaveValidations = builderStore.match(
      undefined,
      FORM('validations'),
      undefined,
      GRAPHS.sourceGraph
    );
    const validationNodes = subjectThatHaveValidations.map(
      (statement) => statement.object
    );

    if (
      this.isRdfTypeInTriplesOfSubjects(
        validationNodes,
        builderStore,
        GRAPHS.sourceGraph
      )
    ) {
      this.args.onUpdateValidations(sourceTtl);
    }
  }

  isRdfTypeInTriplesOfSubjects(subjects, store, graph) {
    for (const subject of subjects) {
      const typeMatches = store.match(subject, RDF('type'), undefined, graph);
      if (!typeMatches.length >= 1) {
        return false;
      }
    }

    return true;
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
