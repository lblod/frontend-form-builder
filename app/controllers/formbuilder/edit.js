import Controller from '@ember/controller';

import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';
import { service } from '@ember/service';
import { sym as RDFNode } from 'rdflib';
import basicFormTemplate from '../../utils/ttl-templates/basic-form-template';
import { restartableTask, timeout } from 'ember-concurrency';
import { ForkingStore } from '@lblod/ember-submission-form-fields';
import { FORM, RDF } from '@lblod/submission-form-helpers';
import { findTtlForUsedConceptSchemesInForm } from '../../utils/find-ttl-for-used-concept-schemes';

export const GRAPHS = {
  formGraph: new RDFNode('http://data.lblod.info/form'),
  metaGraph: new RDFNode('http://data.lblod.info/metagraph'),
  sourceGraph: new RDFNode(`http://data.lblod.info/sourcegraph`),
};

export const PREVIEW_SOURCE_NODE = new RDFNode(
  'http://frontend.poc.form.builder/sourcenode'
);

export default class FormbuilderEditController extends Controller {
  @service store;
  @service router;
  @service toaster;
  @service intl;
  @service('form-code-manager') formCodeManager;
  @service('form-version') formVersionManager;

  @tracked formCode;
  @tracked formVersion;

  @tracked formChanged;

  @tracked previewStore;
  @tracked previewForm;

  @tracked isSaveModalOpen;
  @tracked nextRoute;

  sourceNode = PREVIEW_SOURCE_NODE;

  @action
  setFormChanged(value) {
    this.formChanged = value;
  }

  @action
  handleCodeChange(newCode) {
    if (newCode) {
      this.formCode = newCode;
      this.formCodeManager.addFormCode(this.formCode);
      this.formVersion = this.formVersionManager.getVersionForTtl(
        this.formCode
      );
      console.info(`Current version of form:`, this.formVersion);
    }
    this.setFormChanged(this.formCodeManager.isLatestDeviatingFromReference());
    this.setupPreviewForm.perform(this.formCodeManager.getTtlOfLatestVersion());
  }

  setupPreviewForm = restartableTask(async (ttlCode) => {
    // force a component recreation by unrendering it very briefly
    // Ideally the RdfForm component would do the right thing when the formStore
    // and form arguments change, but we're not there yet.
    await timeout(1);

    this.previewStore = new ForkingStore();

    this.previewStore.parse(
      ttlCode,
      this.model.graphs.formGraph,
      'text/turtle'
    );

    const conceptSchemesTtl = await findTtlForUsedConceptSchemesInForm(
      this.previewStore,
      this.store,
      this.model.graphs.formGraph
    );

    if (conceptSchemesTtl) {
      this.previewStore.parse(
        conceptSchemesTtl,
        this.model.graphs.metaGraph,
        'text/turtle'
      );
    }

    this.previewStore.registerObserver(() => {
      const ttl = this.previewStore.serializeDataMergedGraph(
        this.model.graphs.sourceGraph
      );

      this.formCodeManager.setFormInputDataTtl(ttl);
    }, 'formInputData');

    this.previewForm = this.previewStore.any(
      undefined,
      RDF('type'),
      FORM('Form'),
      this.model.graphs.formGraph
    );
  });

  setup(model) {
    this.formCode = this.getFormTtlCode(model.generatedForm);
    this.formCodeManager.addFormCode(this.formCode);
    this.formCodeManager.pinLatestVersionAsReference();

    this.router.transitionTo('formbuilder.edit.code');
  }

  reset() {
    this.formCodeManager.clearHistory();
  }

  getFormTtlCode(generatedForm) {
    if (!generatedForm.ttlCode || generatedForm.ttlCode == '') {
      return basicFormTemplate;
    }

    return generatedForm.ttlCode;
  }

  showSaveModal(nextRoute) {
    this.isSaveModalOpen = true;
    this.nextRoute = nextRoute;
  }

  saveUnsavedChanges = restartableTask(async () => {
    this.formCodeManager.addFormCode(
      this.formCodeManager.getTtlOfLatestVersion()
    );
    this.formCodeManager.pinLatestVersionAsReference();
    await this.updateTtlCodeOfForm();
    this.isSaveModalOpen = false;
    this.goToNextRoute();
  });

  @action
  discardSave() {
    this.isSaveModalOpen = false;
    this.formCodeManager.addFormCode(
      this.formCodeManager.getTtlOfReferenceVersion()
    );
    this.goToNextRoute();
  }

  @action
  goToNextRoute() {
    this.router.transitionTo(this.nextRoute);
  }

  async updateTtlCodeOfForm() {
    const form = await this.store.findRecord(
      'generated-form',
      this.formCodeManager.getFormId()
    );
    form.ttlCode = this.formCodeManager.getTtlOfReferenceVersion();

    try {
      await form.save();
      this.toaster.success(
        this.intl.t('messages.success.formUpdated'),
        this.intl.t('messages.subjects.success'),
        {
          timeOut: 5000,
        }
      );
    } catch (error) {
      this.toaster.error(
        this.intl.t('messages.error.somethingWentWrong'),
        this.intl.t('messages.subjects.error'),
        {
          timeOut: 5000,
        }
      );
      console.error(`Caught:`, error);
    }
  }
}
