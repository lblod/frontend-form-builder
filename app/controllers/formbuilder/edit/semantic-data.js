import Controller from '@ember/controller';

import { restartableTask } from 'ember-concurrency';
import { ForkingStore } from '@lblod/ember-submission-form-fields';
import { GRAPHS } from '../edit';
import { tracked } from '@glimmer/tracking';
import { A } from '@ember/array';

export default class FormbuilderEditSemanticDataController extends Controller {
  model;
  @tracked data = A([]);

  mapFormData = restartableTask(async (formTtlCode) => {
    const store = new ForkingStore();
    store.parse(formTtlCode, this.graphs.sourceGraph, 'text/turtle');

    const allStatements = store.match(
      undefined,
      undefined,
      undefined,
      this.graphs.sourceGraph
    );

    for (const st of allStatements) {
      const value = { predicate: st.predicate.value, object: st.object.value };
      const index = this.data.findIndex(
        (item) => item.subject == st.subject.value
      );
      console.log(index);
      if (!index || index == -1) {
        this.data.pushObject({
          subject: st.subject.value,
          values: A([value]),
        });
      } else {
        this.data[index].values.pushObject(value);
      }
    }
  });

  setup(model) {
    this.mapFormData.perform(model.ttlCode);
  }

  get graphs() {
    return GRAPHS;
  }
}
