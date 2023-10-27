import { module, test } from 'qunit';
import { setupTest } from 'frontend-form-builder/tests/helpers';

module('Unit | Service | form-code-manager', function (hooks) {
  setupTest(hooks);

  // TODO: Replace this with your real tests.
  test('it exists', function (assert) {
    let service = this.owner.lookup('service:form-code-manager');
    assert.ok(service);
  });
});
