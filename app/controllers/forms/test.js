import Controller from '@ember/controller';

import { tracked } from '@glimmer/tracking';
import { restartableTask } from 'ember-concurrency';
import {
  ForkingStore,
  validateForm,
} from '@lblod/ember-submission-form-fields';
import { FORM, RDF } from '@lblod/submission-form-helpers';
import { findTtlForUsedConceptSchemesInForm } from '../../utils/find-ttl-for-used-concept-schemes';
import { service } from '@ember/service';
import { action } from '@ember/object';
import {
  showErrorToasterMessage,
  showSuccessToasterMessage,
} from '../../utils/toaster-message-helper';

export default class FormsTestController extends Controller {
  @service store;
  @service toaster;
  @service intl;

  @tracked form;
  @tracked formStore;

  @tracked forceShowErrors;
  @tracked shared;

  queryParams = ['shared'];

  setupForm = restartableTask(async () => {
    this.formStore = new ForkingStore();

    this.formStore.parse(
      this.model.form.ttlCode,
      this.model.graphs.formGraph,
      'text/turtle'
    );

    const conceptSchemesTtl = await findTtlForUsedConceptSchemesInForm(
      this.formStore,
      this.store,
      this.model.graphs.formGraph
    );

    if (conceptSchemesTtl) {
      this.formStore.parse(
        conceptSchemesTtl,
        this.model.graphs.metaGraph,
        'text/turtle'
      );
    }

    this.form = this.formStore.any(
      undefined,
      RDF('type'),
      FORM('Form'),
      this.model.graphs.formGraph
    );
  });

  @action
  copyTestFormUrl() {
    const currentUrl = window.location.href;
    let shareUrl = currentUrl;
    if (currentUrl.includes('?')) {
      shareUrl += `&shared`;
    } else {
      shareUrl += `?shared`;
    }

    navigator.clipboard.writeText(shareUrl);
    showSuccessToasterMessage(
      this.toaster,
      shareUrl,
      this.intl.t('messages.subjects.copiedToClipboard'),
      10000
    );
  }

  @action
  testForm() {
    const result = validateForm(this.form, {
      ...this.model.graphs,
      sourceNode: this.model.sourceNode,
      store: this.formStore,
    });

    if (result) {
      showSuccessToasterMessage(
        this.toaster,
        this.intl.t('messages.feedback.formIsValid')
      );
    } else {
      showErrorToasterMessage(
        this.toaster,
        this.intl.t('messages.feedback.formIsInvalid')
      );
    }

    this.forceShowErrors = !result;
  }
}
