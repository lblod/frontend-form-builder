import { module, test } from 'qunit';
import { setupTest } from 'frontend-form-builder/tests/helpers';

module('Unit | Service | form-code-manager', function (hooks) {
  setupTest(hooks);

  const startVersion = -1;
  const emptyArray = [];

  test('it exists', function (assert) {
    let service = this.owner.lookup('service:form-code-manager');
    assert.ok(service);
  });

  test('The start version is -1', function (assert) {
    let formCodeManager = this.owner.lookup('service:form-code-manager');

    assert.deepEqual(formCodeManager.startVersion, startVersion);
    assert.deepEqual(formCodeManager.latestVersion, startVersion);
    assert.deepEqual(formCodeManager.referenceVersion, startVersion);
  });

  test('The formId is not set initially', function (assert) {
    let formCodeManager = this.owner.lookup('service:form-code-manager');
    const formIdIsNull = null;

    assert.deepEqual(formCodeManager.formId, formIdIsNull);
    assert.notOk(formCodeManager.isFormIdSet());
  });

  test('When no formId is set it throws an error', function (assert) {
    let formCodeManager = this.owner.lookup('service:form-code-manager');
    let intl = this.owner.lookup('service:intl');
    const formIdIsNull = null;

    assert.deepEqual(formCodeManager.formId, formIdIsNull);
    assert.throws(
      () => formCodeManager.getFormId(),
      intl.t('messages.error.couldNotGetFormIdIsNotSet')
    );
  });

  test('Can set a form id', function (assert) {
    let formCodeManager = this.owner.lookup('service:form-code-manager');
    const formId = 'identifier';

    formCodeManager.setFormId(formId);
    assert.deepEqual(formCodeManager.formId, formId);
    assert.deepEqual(formCodeManager.getFormId(), formId);
    assert.ok(formCodeManager.isFormIdSet());
  });

  test('Reset versions will set all versions to the startVersion', function (assert) {
    let formCodeManager = this.owner.lookup('service:form-code-manager');
    formCodeManager.latestVersion = 3;
    formCodeManager.referenceVersion = 3;

    formCodeManager.resetVersions();

    assert.deepEqual(formCodeManager.latestVersion, startVersion);
    assert.deepEqual(formCodeManager.referenceVersion, startVersion);
  });

  test('The form code history is empty initially', function (assert) {
    let formCodeManager = this.owner.lookup('service:form-code-manager');

    assert.deepEqual(formCodeManager.formCodeHistory, emptyArray);
  });

  test('ClearHistory will empty the history array and sets the versions to startVersion', function (assert) {
    let formCodeManager = this.owner.lookup('service:form-code-manager');
    formCodeManager.formCodeHistory = ['item'];

    formCodeManager.clearHistory();

    assert.deepEqual(formCodeManager.formCodeHistory, emptyArray);
    assert.deepEqual(formCodeManager.latestVersion, startVersion);
    assert.deepEqual(formCodeManager.referenceVersion, startVersion);
  });

  test('Clear history will not reset the form id', function (assert) {
    let formCodeManager = this.owner.lookup('service:form-code-manager');
    formCodeManager.setFormId('identifier');
    formCodeManager.clearHistory();

    assert.ok(formCodeManager.isFormIdSet);
  });

  test('Reset will cleanup the history and reset the versions and set the formId to null', function (assert) {
    let formCodeManager = this.owner.lookup('service:form-code-manager');

    assert.deepEqual(formCodeManager.formCodeHistory, emptyArray);
    assert.deepEqual(formCodeManager.latestVersion, startVersion);
    assert.deepEqual(formCodeManager.referenceVersion, startVersion);
    assert.notOk(formCodeManager.isFormIdSet());
  });
});
