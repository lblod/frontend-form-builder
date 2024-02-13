import Controller from '@ember/controller';

import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';
import { service } from '@ember/service';
import { restartableTask, timeout } from 'ember-concurrency';
import {
  DESCRIPTION_NOT_USED_PLACEHOLDER,
  NAME_INPUT_CHAR_LIMIT,
} from '../../utils/constants';
import { getLocalFileContentAsText } from '../../utils/get-local-file-content';
import { ForkingStore } from '@lblod/ember-submission-form-fields';
import { FORM, RDF } from '@lblod/submission-form-helpers';
import { PREVIEW_SOURCE_NODE } from './edit';

export default class FormbuilderNewController extends Controller {
  @service store;
  @service router;
  @service toaster;
  @service intl;

  @tracked name = '';
  @tracked duplicateNames = [];
  @tracked hasBeenFocused = false;
  sourceNode = PREVIEW_SOURCE_NODE;

  @tracked selectedTemplate;
  @tracked selectedTemplateTtlCode;

  @tracked createdFormId;
  @tracked previewStore;
  @tracked previewForm;

  async setup(model) {
    await this.setTemplate(model.templates[0]);
  }

  @action
  async createFormFromTemplate() {
    const now = new Date();

    const createdForm = await this.store.createRecord('generated-form', {
      created: now,
      modified: now,
      label: this.name,
      comment: DESCRIPTION_NOT_USED_PLACEHOLDER,
      ttlCode: this.selectedTemplateTtlCode,
    });

    try {
      await createdForm.save();
      await createdForm.save();
      this.router.transitionTo('formbuilder.edit', createdForm.id);
      this.toaster.success(
        this.intl.t('messages.success.formCreated'),
        this.intl.t('messages.subjects.success'),
        {
          timeOut: 5000,
        }
      );
    } catch (err) {
      this.toaster.error(
        this.intl.t('messages.error.somethingWentWrong'),
        this.intl.t('messages.subjects.error'),
        {
          timeOut: 5000,
        }
      );
      console.error(err);
    }
  }

  @action
  async setTemplate(template) {
    if (!template.path || template.path.trim() == '') {
      this.toaster.error(
        this.intl.t('messages.error.invalidTemplatePath', {
          templateLabel: template.label,
        }),
        this.intl.t('messages.subjects.error'),
        {
          timeOut: 5000,
        }
      );
      return;
    }

    if (!this.selectedTemplate) {
      this.selectedTemplate = this.model.templates[0];
    }

    this.selectedTemplateTtlCode = await getLocalFileContentAsText(
      template.path
    );
    this.selectedTemplate = template;
    this.setupPreviewForm.perform(this.selectedTemplateTtlCode);
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

    this.previewForm = this.previewStore.any(
      undefined,
      RDF('type'),
      FORM('Form'),
      this.model.graphs.formGraph
    );
  });

  handleNameChange = restartableTask(async (event) => {
    this.name = event.target.value.trim();
    this.duplicateNames = await this.store.query('generated-form', {
      filter: {
        ':exact:label': this.name,
      },
    });
    this.hasBeenFocused = true;
  });

  get inputErrorMessage() {
    if (this.name.trim() == '' && this.hasBeenFocused) {
      return this.intl.t('constraints.mandatoryField');
    }
    if (this.duplicateNames.length > 0) {
      return this.intl.t('constraints.duplicateName');
    }

    if (this.name.length > NAME_INPUT_CHAR_LIMIT) {
      return this.intl.t('constraints.maxCharactersReached');
    }

    return false;
  }

  get getCharacters() {
    return this.intl.t('messages.feedback.remainingCharacters', {
      currentCount: NAME_INPUT_CHAR_LIMIT - this.name.length,
    });
  }

  get disableSubmit() {
    return (
      (this.name.trim() == '' && this.hasBeenFocused) ||
      this.duplicateNames.length > 0 ||
      !this.hasBeenFocused ||
      this.name.length > NAME_INPUT_CHAR_LIMIT
    );
  }
}
