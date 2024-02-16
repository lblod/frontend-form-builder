import Controller from '@ember/controller';

import { tracked } from '@glimmer/tracking';
import { restartableTask } from 'ember-concurrency';
import { ForkingStore } from '@lblod/ember-submission-form-fields';
import { FORM, RDF } from '@lblod/submission-form-helpers';
import { findTtlForUsedConceptSchemesInForm } from '../../utils/find-ttl-for-used-concept-schemes';
import { service } from '@ember/service';
import { action } from '@ember/object';
import { showSuccessToasterMessage } from '../../utils/toaster-message-helper';

export default class FormsTestController extends Controller {
  @service store;
  @service toaster;
  @service intl;

  @tracked form;
  @tracked formStore;

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
    navigator.clipboard.writeText(currentUrl);
    showSuccessToasterMessage(
      this.toaster,
      currentUrl,
      this.intl.t('messages.subjects.copiedToClipboard'),
      10000
    );
  }
}
