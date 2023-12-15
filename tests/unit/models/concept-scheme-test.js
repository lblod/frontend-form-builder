import { module, test } from 'qunit';

import { setupTest } from 'frontend-form-builder/tests/helpers';

module('Unit | Model | concept scheme', function (hooks) {
  setupTest(hooks);

  // Replace this with your real tests.
  test('it exists', function (assert) {
    let store = this.owner.lookup('service:store');
    let model = store.createRecord('concept-scheme', {});
    assert.ok(model);
  });
});
