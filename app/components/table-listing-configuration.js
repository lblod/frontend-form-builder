import Component from '@glimmer/component';

import { service } from '@ember/service';
import { tracked } from '@glimmer/tracking';
import { ForkingStore } from '@lblod/ember-submission-form-fields';
import { GRAPHS } from '../controllers/formbuilder/edit';
import { RDF, FORM, SHACL } from '@lblod/submission-form-helpers';
import { getMinimalNodeInfo } from '../utils/forking-store-helpers';
import { action } from '@ember/object';
import { sortObjectsOnProperty } from '../utils/sort-object-on-property';
import { EXT } from '../utils/namespaces';
import { getTtlWithAddedStatements } from '../utils/forking-store/get-ttl-with-statements-added';
import { getTtlInStore } from '../utils/forking-store/get-ttl-in-store';

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
        tableListing: tableListing,
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
  async setColumnAction(action) {
    this.selectedColumnAction = action;
    await this.updateScopeInStore();
  }

  async updateScopeInStore() {
    if (
      !this.isScopeCreated(this.selectedColumn.subject.value) &&
      this.selectedColumnAction.label !== this.columnActions[0].label
    ) {
      await this.removeExistingScopeAndGeneratorFromTableListing();

      const statements = this.ttlToStatements(
        this.getTtlCodeForForm(
          this.selectedColumn.subject,
          this.selectedTable.tableListing
        )
      );
      const ttl = getTtlWithAddedStatements(
        getTtlInStore(this.store),
        statements
      );
      this.formCodeManager.addFormCode(ttl);
    }

    if (this.selectedColumnAction.label == this.columnActions[0].label) {
      const subject = EXT(this.getScopeName(this.selectedColumn.subject.value));
      const scopeStatements = this.store.match(
        subject,
        undefined,
        undefined,
        this.graphs.sourceGraph
      );
      this.store.removeStatements([
        ...scopeStatements,
        ...this.getStatementsToRemoveScopeOfSelectedTableListing(),
      ]);
      this.formCodeManager.addFormCode(getTtlInStore(this.store));
    }
  }

  getStatementsToRemoveScopeOfSelectedTableListing() {
    return this.store.match(
      this.selectedTable.tableListing,
      FORM('scope'),
      EXT(this.getScopeName(this.selectedColumn.subject.value)),
      this.graphs.sourceGraph
    );
  }

  async removeExistingScopeAndGeneratorFromTableListing() {
    const tableListingSubject = this.selectedTable.tableListing;
    const columnSubject = this.selectedColumn.subject;
    return new Promise((resolve) => {
      const generators = this.store.match(
        tableListingSubject,
        FORM('createGenerator'),
        undefined,
        this.graphs.sourceGraph
      );
      const scopes = this.store.match(
        tableListingSubject,
        FORM('scope'),
        undefined,
        this.graphs.sourceGraph
      );
      const columnPaths = this.store.match(
        columnSubject,
        SHACL('path'),
        undefined,
        this.graphs.sourceGraph
      );
      this.store.removeStatements([...generators, ...scopes, ...columnPaths]);
      resolve();
    });
  }

  isScopeCreated(columnUri) {
    return (
      this.store.match(
        EXT(this.getScopeName(columnUri)),
        undefined,
        undefined,
        this.graphs.formGraph
      ).length >= 1
    );
  }

  getTtlCodeForForm(columnNode, tableListingUri) {
    return `
    @prefix : <#>.
    @prefix xsd: <http://www.w3.org/2001/XMLSchema#>.
    @prefix display: <http://lblod.data.gift/display-types/>.
    @prefix form: <http://lblod.data.gift/vocabularies/forms/>.
    @prefix sh: <http://www.w3.org/ns/shacl#>.
    @prefix nodes: <http://data.lblod.info/form-data/nodes/>.
    @prefix ext: <http://mu.semte.ch/vocabularies/ext/>.

    nodes:${this.getIdOfuri(columnNode.value)} sh:path ext:amount .

    nodes:${this.getIdOfuri(tableListingUri.value)}
      form:createGenerator ext:${this.getGeneratorName(columnNode.value)} ;
      form:scope ext:${this.getScopeName(columnNode.value)} .

    ext:${this.getGeneratorName(columnNode.value)}
      a form:Generator;
        form:dataGenerator form:addMuUuid;
        form:prototype [
            form:shape [
              a ext:Expense ;
                ext:amount 0.0
            ]
          ] .

    ext:${this.getScopeName(
      columnNode.value
    )} a form:Scope; sh:path ext:Expense.
    `;
  }

  ttlToStatements(ttl) {
    const store = new ForkingStore();
    store.parse(ttl, this.graphs.sourceGraph, 'text/turtle');

    return store.match(
      undefined,
      undefined,
      undefined,
      this.graphs.sourceGraph
    );
  }

  getScopeName(columnUri) {
    return `${this.getIdOfuri(columnUri)}-outcomeS`;
  }

  getGeneratorName(columnUri) {
    return `${this.getIdOfuri(columnUri)}-generator`;
  }

  getIdOfuri(uri) {
    const parts = uri.split('/');
    const id = parts[parts.length - 1];

    return id;
  }

  get scopePath() {
    return EXT('outcome');
  }

  get sortedTables() {
    return this.tables; // sort them on order, section and columns TODO:
  }

  get tableOptions() {
    return sortObjectsOnProperty(
      this.tables.map((table) => {
        return {
          tableListing: table.tableListing,
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
    const allowedDisplaytypes = [
      'http://lblod.data.gift/display-types/currencyInput',
      'http://lblod.data.gift/display-types/numericalInput',
    ];

    const columns = table.columns.filter((column) =>
      allowedDisplaytypes.includes(column.displayType.value)
    );

    return sortObjectsOnProperty(columns, 'order');
  }

  get columnActions() {
    return [{ label: 'Geen actie' }, { label: 'Som' }];
  }

  get graphs() {
    return GRAPHS;
  }
}
