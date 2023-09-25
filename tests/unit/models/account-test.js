import { module, test } from 'qunit';

import { setupTest } from 'frontend-form-builder/tests/helpers';

module('Unit | Model | account', function (hooks) {
  setupTest(hooks);

  // Replace this with your real tests.
  test('it exists', function (assert) {
    let store = this.owner.lookup('service:store');
    let model = store.createRecord('account', {});
    assert.ok(model);
  });
});
