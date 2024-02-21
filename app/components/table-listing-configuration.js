import Component from '@glimmer/component';

import { service } from '@ember/service';
import { tracked } from '@glimmer/tracking';
import { ForkingStore } from '@lblod/ember-submission-form-fields';
import { GRAPHS } from '../controllers/formbuilder/edit';
import { RDF, FORM, SHACL } from '@lblod/submission-form-helpers';

export default class TableListingConfigurationComponent extends Component {
  @service('form-code-manager') formCodeManager;
  @tracked tables;

  constructor() {
    super(...arguments);
    const tableListingUris = this.getTableListingUris();
    console.log({ tableListingUris });
  }

  getTableListingUris() {
    const ttlCode = this.formCodeManager.getTtlOfLatestVersion();
    const store = new ForkingStore();
    store.parse(ttlCode, GRAPHS.sourceGraph, 'text/turtle');

    return store
      .match(undefined, RDF('type'), FORM('ListingTable'))
      .map((triple) => triple.subject);
  }

  getSectionTitleAndColumnsForTables(tableUris) {

  }
}
