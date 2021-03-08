import Controller from '@ember/controller';
import { inject as service } from '@ember/service';
import { task } from 'ember-concurrency-decorators';

export default class UserTestsEditController extends Controller {

  @service semanticForm;

  submit() {
  }

  @task
  * save() {
    yield this.semanticForm.update(this.model.test, this.model.graph, {graphs: this.model.graphs});
  }

  reset() {
  }

  @task
  * delete() {
    yield this.semanticForm.delete(this.model.graph, {graphs: this.model.graphs});
    yield this.model.test.destroyRecord();
    this.transitionToRoute('user-tests.index');
  }

}
