import Component from '@glimmer/component';

import { service } from '@ember/service';
import { tracked } from '@glimmer/tracking';
import { ForkingStore } from '@lblod/ember-submission-form-fields';
import { GRAPHS } from '../controllers/formbuilder/edit';
import { RDF, FORM, SHACL } from '@lblod/submission-form-helpers';
import { getMinimalNodeInfo } from '../utils/forking-store-helpers';
import { action } from '@ember/object';
import { sortObjectsOnProperty } from '../utils/sort-object-on-property';
import { BlankNode, Statement } from 'rdflib';
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
  setColumnAction(action) {
    this.selectedColumnAction = action;
    this.updateScopeInStore();
  }

  updateScopeInStore() {
    if (
      !this.isScopeCreated(this.selectedColumn.subject.value) &&
      this.selectedColumnAction.label !== this.columnActions[0].label
    ) {
      this.addScopeToTtl();
      this.addScopeOfSelectedTableListing();
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

  createGeneratorStatements() {
    const columnUri = this.selectedColumn.subject.value;
    const subject = this.getGeneratorName(columnUri);
    const prototypeBlankNode = new BlankNode(
      this.getPrototypeBlankNodeName(columnUri)
    );
    const shapeBlankNode = new BlankNode(this.getShapeBlankNodeName(columnUri));
    return [
      new Statement(
        subject,
        RDF('type'),
        FORM('Generator'),
        this.graphs.sourceGraph
      ),
      new Statement(
        subject,
        FORM('prototype'),
        prototypeBlankNode,
        this.graphs.sourceGraph
      ),
      new Statement(
        prototypeBlankNode,
        FORM('shape'),
        shapeBlankNode,
        this.graphs.sourceGraph
      ),
      new Statement(
        shapeBlankNode,
        RDF('type'),
        EXT('Outcome'),
        this.graphs.sourceGraph
      ),
      new Statement(shapeBlankNode, EXT('amount'), 0, this.graphs.sourceGraph),
    ];
  }

  addScopeOfSelectedTableListing() {
    this.store.addAll([
      new Statement(
        this.selectedTable.tableListing,
        FORM('scope'),
        EXT(this.getScopeName(this.selectedColumn.subject.value)),
        this.graphs.sourceGraph
      ),
    ]);

    const ttlCodeWithAddedScope = getTtlWithAddedStatements(
      getTtlInStore(this.store),
      this.createScopeStatements()
    );

    this.formCodeManager.addFormCode(ttlCodeWithAddedScope);
  }
  getStatementsToRemoveScopeOfSelectedTableListing() {
    return this.store.match(
      this.selectedTable.tableListing,
      FORM('scope'),
      EXT(this.getScopeName(this.selectedColumn.subject.value)),
      this.graphs.sourceGraph
    );
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

  addScopeToTtl() {
    const ttlCodeWithAddedScope = getTtlWithAddedStatements(
      getTtlInStore(this.store),
      this.createScopeStatements()
    );

    this.formCodeManager.addFormCode(ttlCodeWithAddedScope);
  }

  createScopeStatements() {
    const subject = EXT(this.getScopeName(this.selectedColumn.subject.value));
    const type = new Statement(
      subject,
      RDF('type'),
      FORM('scope'),
      this.graphs.sourceGraph
    );
    const path = new Statement(
      subject,
      SHACL('path'),
      this.scopePath,
      this.graphs.sourceGraph
    );

    return [type, path];
  }

  get scopePath() {
    return EXT('outcome');
  }

  getScopeName(columnUri) {
    const url = columnUri;
    const parts = url.split('/');
    const id = parts[parts.length - 1];

    return `${id}-outcomeS`;
  }

  getGeneratorName(columnUri) {
    const url = columnUri;
    const parts = url.split('/');
    const id = parts[parts.length - 1];

    return `${id}-generator`;
  }

  getPrototypeBlankNodeName(columnUri) {
    const url = columnUri;
    const parts = url.split('/');
    const id = parts[parts.length - 1];

    return `${id}-prototype-blankNode`;
  }

  getShapeBlankNodeName(columnUri) {
    const url = columnUri;
    const parts = url.split('/');
    const id = parts[parts.length - 1];

    return `${id}-shape-blankNode`;
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

    return sortObjectsOnProperty(table.columns, 'order');
  }

  get columnActions() {
    return [{ label: 'Geen actie' }, { label: 'Som' }];
  }

  get graphs() {
    return GRAPHS;
  }
}
