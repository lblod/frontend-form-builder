import Controller from '@ember/controller';

import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';
import { service } from '@ember/service';
import { sym as RDFNode } from 'rdflib';
import basicFormTemplate from '../../utils/ttl-templates/basic-form-template';
import { restartableTask, timeout } from 'ember-concurrency';
import { ForkingStore } from '@lblod/ember-submission-form-fields';
import { FORM, RDF } from '@lblod/submission-form-helpers';

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

    const conceptSchemesTtl = await this.getConceptSchemesAsTtlInTtlCode(
      this.previewStore
    );

    if (conceptSchemesTtl) {
      this.previewStore.parse(
        conceptSchemesTtl,
        this.model.graphs.metaGraph,
        'text/turtle'
      );
    }

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

  async getConceptSchemesAsTtlInTtlCode(ttlCode) {
    const ttlCodeArray = [];
    const uris = this.getConceptSchemeUrisInTtl(ttlCode);

    if (uris.length == 0) {
      return;
    }

    for (const conceptSchemeUri of uris) {
      const conceptSchemes = await this.store.query('concept-scheme', {
        include: 'concepts',
        filter: {
          ':uri:': conceptSchemeUri,
        },
      });
      const conceptSchemesAsArray = [...conceptSchemes];
      const ttl = await this.conceptSchemesWithConceptsToTtl(
        conceptSchemesAsArray
      );
      ttlCodeArray.push(ttl);
    }

    return ttlCodeArray.join('\n');
  }

  async conceptSchemesWithConceptsToTtl(conceptSchemes) {
    const ttlArray = [];
    for (const conceptScheme of conceptSchemes) {
      ttlArray.push(await conceptScheme.modelWithConceptsAsTtlCode());
    }

    return ttlArray.join(' ');
  }

  getConceptSchemeUrisInTtl(store) {
    const formOptions = store.match(
      undefined,
      FORM('options'),
      undefined,
      this.model.graphs.formGraph
    );

    const conceptSchemeUris = [];
    for (const triple of formOptions) {
      const optionsAsString = triple.object;
      try {
        const jsonOptions = JSON.parse(optionsAsString);
        conceptSchemeUris.push(jsonOptions.conceptScheme);
      } catch (error) {
        return;
      }
    }
    return conceptSchemeUris;
  }
}
