import Component from '@glimmer/component';

import { service } from '@ember/service';
import { tracked } from '@glimmer/tracking';
import { ForkingStore } from '@lblod/ember-submission-form-fields';
import { GRAPHS } from '../controllers/formbuilder/edit';
import { RDF, FORM, SHACL } from '@lblod/submission-form-helpers';
import { getMinimalNodeInfo } from '../utils/forking-store-helpers';

export default class TableListingConfigurationComponent extends Component {
  @service('form-code-manager') formCodeManager;
  @tracked tables;

  store;

  constructor() {
    super(...arguments);
    this.setupStore();
    this.setSectionTitleAndColumnsForTables(this.getTableListingUris());
  }

  setupStore() {
    const ttlCode = this.formCodeManager.getTtlOfLatestVersion();
    this.store = new ForkingStore();
    this.store.parse(ttlCode, this.graphs.sourceGraph, 'text/turtle');
  }

  getTableListingUris() {
    return this.store
      .match(undefined, RDF('type'), FORM('ListingTable'))
      .map((triple) => triple.subject);
  }

  setSectionTitleAndColumnsForTables(tableUris) {
    this.tables = tableUris.map((tableListing) => {
      const sectionNode = this.store.any(
        tableListing,
        FORM('partOf'),
        undefined,
        this.graphs.sourceGraph
      );

      const subform = this.store.any(
        tableListing,
        FORM('each'),
        undefined,
        this.graphs.sourceGraph
      );
      const columnSubjects = this.store
        .match(subform, FORM('includes'), undefined, this.graphs.sourceGraph)
        .map((triple) => triple.object);

      return {
        sectionTitle: getMinimalNodeInfo(
          sectionNode,
          this.store,
          this.graphs.sourceGraph
        ).name,
        columns: columnSubjects.map((columnNode) =>
          getMinimalNodeInfo(columnNode, this.store, this.graphs.sourceGraph)
        ),
      };
    });
  }

  get graphs() {
    return GRAPHS;
  }
}
