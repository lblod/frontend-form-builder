import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { restartableTask, timeout } from 'ember-concurrency';
import { getFieldAndValidationTriples } from '../utils/get-field-and-validation-triples';

export default class FieldValidationsFormComponent extends Component {
  @tracked store;

  form;
  graphs;
  fieldSubject;

  fieldAndValidationTriples = [];

  constructor() {
    super(...arguments);

    this.fieldSubject = this.args.fieldSubject;
    this.store = this.args.store;
    this.form = this.args.form;
    this.graphs = this.args.graphs;

    this.setCurrentFieldAndValidationTriples();

    this.store.registerObserver(() => {
      this.updateFieldForm.perform();
    });
  }

  setCurrentFieldAndValidationTriples() {
    this.fieldAndValidationTriples = getFieldAndValidationTriples(
      this.fieldSubject,
      this.store,
      this.graphs.sourceGraph
    );
  }

  updateFieldForm = restartableTask(async () => {
    await timeout(1);

    this.setCurrentFieldAndValidationTriples();

    this.args.updateTtlCodeWithField({
      fieldSubject: this.fieldSubject,
      triples: this.fieldAndValidationTriples,
    });
  });
}
