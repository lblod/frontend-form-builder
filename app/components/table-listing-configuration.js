import Component from '@glimmer/component';

import { service } from '@ember/service';
import { tracked } from '@glimmer/tracking';
import { ForkingStore } from '@lblod/ember-submission-form-fields';
import { GRAPHS } from '../controllers/formbuilder/edit';
import { RDF, FORM } from '@lblod/submission-form-helpers';
import { getMinimalNodeInfo } from '../utils/forking-store-helpers';
import { action } from '@ember/object';
import { sortObjectsOnProperty } from '../utils/sort-object-on-property';

export default class TableListingConfigurationComponent extends Component {
  @service('form-code-manager') formCodeManager;
  @tracked tables;
  @tracked selectedTable;
  @tracked selectedColumn;
  @tracked selectedColumnAction;

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
        section: getMinimalNodeInfo(
          sectionNode,
          this.store,
          this.graphs.sourceGraph
        ),
        columns: columnSubjects.map((columnNode) => {
          return {
            ...getMinimalNodeInfo(
              columnNode,
              this.store,
              this.graphs.sourceGraph
            ),
          };
        }),
      };
    });
  }

  @action
  setTable(table) {
    this.selectedTable = table;
  }

  @action
  setColumnForTable(column) {
    this.selectedColumn = column;
  }

  @action
  setColumnAction(action) {
    this.selectedColumnAction = action;
    console.log(
      `set action '${action.label}' on column '${this.selectedColumn.name}' for table '${this.selectedTable.name}'`
    );
  }

  get sortedTables() {
    return this.tables; // sort them on order, section and columns TODO:
  }

  get tableOptions() {
    return sortObjectsOnProperty(
      this.tables.map((table) => {
        return {
          subject: table.section.subject,
          name: table.section.name,
          order: table.section.order,
        };
      }),
      'order'
    );
  }

  get columnOptions() {
    if (!this.selectedTable) {
      return [];
    }

    const table = this.tables.find(
      (table) => table.section.subject == this.selectedTable.subject
    );

    if (!table) {
      return [];
    }

    return sortObjectsOnProperty(table.columns, 'order');
  }

  get columnActions() {
    return [{ label: 'Geen actie' }, { label: 'Som' }];
  }

  get graphs() {
    return GRAPHS;
  }
}
