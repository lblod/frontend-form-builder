import Controller from '@ember/controller';
import { inject as service } from '@ember/service';
import { task } from 'ember-concurrency-decorators';

export default class UserTestsEditController extends Controller {

  @service semanticForm;

  submit() {
  }

  @task
  * save() {
    yield this.semanticForm.update(this.model.graph, {graphs: this.model.graphs});
    this.model.test.modified = new Date();
    this.model.test.save();
  }

  @task
  * reset() {
    yield this.semanticForm.delete(this.model.graph, {graphs: this.model.graphs});
    this.transitionToRoute('user-tests.edit', this.model.test.id);
  }

  @task
  * delete() {
    yield this.semanticForm.delete(this.model.graph, {graphs: this.model.graphs});
    yield this.model.test.destroyRecord();
    this.transitionToRoute('user-tests.index');
  }

}
