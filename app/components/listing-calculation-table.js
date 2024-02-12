import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';

export default class ListingCalculationTableComponent extends Component {
  @tracked tableRows = [];

  constructor() {
    super(...arguments);
    console.log(`ListingCalculationTableComponent | args`, this.args);

    this.tableRows = this.getTablesValuesForSourceNode();
  }

  get tableName() {
    return this.args.field.label;
  }

  getTablesValuesForSourceNode() {
    const sourceNode = this.args.field.uri;
    console.log('sourceNode:', sourceNode);
    const fieldTriples = this.args.formStore.match(
      sourceNode,
      undefined,
      undefined,
      this.args.graphs.formGraph
    );
    console.log('fieldTriples:', fieldTriples);

    const values = [1];

    return this.mapValuesForTable(values);
  }

  mapValuesForTable(tableRowValues) {
    return tableRowValues.map((rowValues) => this.mapTableRowValue(rowValues));
  }
  mapTableRowValue(rowValues) {
    return {
      key: 'Werkingskosten',
      number: 23,
      accountability: 'Verandwoording',
    };
  }
}
