import { ForkingStore } from '@lblod/ember-submission-form-fields';
import { GRAPHS } from '../../controllers/formbuilder/edit';

export async function getTurtleTextForStatements(statements) {
  return new Promise((resolve) => {
    const store = new ForkingStore();
    try {
      for (const statement of statements) {
        if (statement.length) {
          store.addAll(statement);
          continue;
        }
        store.addAll([statement]);
      }
    } catch (error) {
      console.error(`Could not parse statements in the graph`, error);
      resolve(null);
    }

    resolve(store.serializeDataMergedGraph(GRAPHS.sourceGraph));
  });
}
