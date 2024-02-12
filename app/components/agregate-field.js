import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { guidFor } from '@ember/object/internals';
import { EXT } from '../utils/namespaces';
import { restartableTask } from 'ember-concurrency';

export default class AgregateFieldComponent extends Component {
  @tracked totals;
  id = guidFor(this);

  constructor() {
    super(...arguments);

    this.args.formStore.registerObserver(() => {
      // This will potentially run a lot of times. We can probably check the delta and see if the change affects this component, but due to time constraints we're skipping that for now.
      // It's also possible that the delta checking is more intensive than the actual computations, but that would have to be benchmarked.
      this.calculateTotals.perform();
    }, this.id);
  }

  get fieldName() {
    return this.args.field.label;
  }

  get formattedTotal() {
    let amount = this.totals;
    if (!this.totals) {
      amount = 0.0;
    }

    return new Intl.NumberFormat('nl-BE', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  }

  calculateTotals = restartableTask(async () => {
    const { formStore, graphs } = this.args;

    const pathToField = this.args.formStore.any(
      this.args.field.uri,
      EXT('pathToField'),
      undefined,
      this.args.graphs.formGraph
    );
    if (pathToField) {
      const pathNodes = pathToField.elements;
      const pathPredicate = pathNodes[1];

      const amounts = formStore.match(
        undefined,
        pathPredicate,
        undefined,
        graphs.sourceGraph
      );

      let total = 0;
      amounts.forEach((item) => {
        total += Number(item.object.value) ?? 0;
      });
      this.totals = total;
      console.log(`totals`, this.totals);
    }
  });

  willDestroy() {
    super.willDestroy(...arguments);
    this.args.formStore.deregisterObserver(this.id);
  }
}
