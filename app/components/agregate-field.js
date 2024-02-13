import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { guidFor } from '@ember/object/internals';
import { XSD, triplesForPath } from '@lblod/submission-form-helpers';
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

  calculateTotals = restartableTask(
    async () => {
      const target = this.args.formStore.any(
        this.args.field.uri,
        XSD('target'),
        undefined,
        this.args.graphs.formGraph
      );

      const options = {
        path: target,
        store: this.args.formStore,
        formGraph: this.args.graphs.formGraph,
        sourceGraph: this.args.graphs.sourceGraph,
        sourceNode: this.args.sourceNode,
      };
      const triplesforPathOutput = triplesForPath(options);

      console.log('triplesforPathOutput ', triplesforPathOutput);
    }

    // const amounts = formStore.match(
    //   undefined,
    //   mappedTarget.targetValue,
    //   undefined,
    //   graphs.sourceGraph
    // );
    // console.log(`amounts`, amounts);

    // let total = 0;
    // amounts.forEach((item) => {
    //   total += Number(item.object.value) ?? 0;
    // });
    // this.totals = total;
  );

  willDestroy() {
    super.willDestroy(...arguments);
    this.args.formStore.deregisterObserver(this.id);
  }
}
