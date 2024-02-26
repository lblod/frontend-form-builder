import { module, test } from 'qunit';
import { setupTest } from 'frontend-form-builder/tests/helpers';

module('Unit | Route | formbuilder/edit/sematic-data', function (hooks) {
  setupTest(hooks);

  test('it exists', function (assert) {
    let route = this.owner.lookup('route:formbuilder/edit/sematic-data');
    assert.ok(route);
  });
});
