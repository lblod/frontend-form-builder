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

  test('Can add code to the history', function (assert) {
    let formCodeManager = this.owner.lookup('service:form-code-manager');
    const ttlCodeV1 = 'ttlCode v1';
    const ttlCodeV2 = 'ttlCode v2';

    formCodeManager.addFormCode(ttlCodeV1);
    assert.deepEqual(formCodeManager.formCodeHistory, [ttlCodeV1]);

    formCodeManager.addFormCode(ttlCodeV2);
    assert.deepEqual(formCodeManager.formCodeHistory, [ttlCodeV1, ttlCodeV2]);
  });

  test('Adding the first ttl to the manager will be version 0', function (assert) {
    let formCodeManager = this.owner.lookup('service:form-code-manager');
    const ttlCodeV1 = 'ttlCode v1';

    formCodeManager.addFormCode(ttlCodeV1);

    assert.deepEqual(formCodeManager.latestVersion, 0);
    assert.deepEqual(formCodeManager.formCodeHistory, [ttlCodeV1]);
  });

  test('When adding ttl code that is the same as previous version will not result in a new latest version', function (assert) {
    let formCodeManager = this.owner.lookup('service:form-code-manager');
    const ttlCode = 'ttlCode';
    const versionWhenHistoryHasOneEntree = 0;

    formCodeManager.addFormCode(ttlCode);
    assert.deepEqual(
      formCodeManager.latestVersion,
      versionWhenHistoryHasOneEntree
    );

    formCodeManager.addFormCode(ttlCode);
    assert.deepEqual(
      formCodeManager.latestVersion,
      versionWhenHistoryHasOneEntree
    );
  });

  test('Adding three different ttl versions and pinning the second one as reference', function (assert) {
    let formCodeManager = this.owner.lookup('service:form-code-manager');
    const ttlCodeV1 = 'ttlCode v1';
    const referenceTtl = 'ttlCode referenced';
    const ttlCodeV3 = 'ttlCode v3';

    formCodeManager.addFormCode(ttlCodeV1);
    formCodeManager.addFormCode(referenceTtl);
    formCodeManager.pinLatestVersionAsReference();
    formCodeManager.addFormCode(ttlCodeV3);

    assert.deepEqual(formCodeManager.referenceVersion, 1);
    assert.deepEqual(formCodeManager.latestVersion, 2);

    assert.deepEqual(formCodeManager.formCodeHistory, [
      ttlCodeV1,
      referenceTtl,
      ttlCodeV3,
    ]);

    assert.deepEqual(formCodeManager.getTtlOfLatestVersion(), ttlCodeV3);
    assert.deepEqual(formCodeManager.getTtlOfReferenceVersion(), referenceTtl);
  });

  test('Check if latest and reference version is deviating', function (assert) {
    let formCodeManager = this.owner.lookup('service:form-code-manager');
    const ttlCodeV1 = 'ttlCode v1';
    const referenceTtl = 'ttlCode referenced';
    const ttlCodeV3 = 'ttlCode v3';

    formCodeManager.addFormCode(ttlCodeV1);
    formCodeManager.addFormCode(referenceTtl);
    formCodeManager.pinLatestVersionAsReference();

    assert.notOk(formCodeManager.isLatestDeviatingFromReference());

    formCodeManager.addFormCode(ttlCodeV3);

    assert.ok(formCodeManager.isLatestDeviatingFromReference());
  });

  test('Check if ttl code is the same as the latest ttl code', function (assert) {
    let formCodeManager = this.owner.lookup('service:form-code-manager');
    const ttlCodeV1 = 'ttlCode v1';
    const latestTtl = 'latest ttl';

    formCodeManager.addFormCode(ttlCodeV1);
    formCodeManager.addFormCode(latestTtl);

    assert.notOk(formCodeManager.isTtlTheSameAsLatest('latest TTL CODE'));
    assert.ok(formCodeManager.isTtlTheSameAsLatest(latestTtl));
  });

  test('The form input data is not set initially', function (assert) {
    let formCodeManager = this.owner.lookup('service:form-code-manager');

    assert.deepEqual(formCodeManager.formInputDataTtl, null);
  });

  test('The form input data can be set and get after', function (assert) {
    let formCodeManager = this.owner.lookup('service:form-code-manager');
    const inputData = 'form input data';

    assert.deepEqual(formCodeManager.formInputDataTtl, null);

    formCodeManager.setFormInputDataTtl(inputData);
    assert.deepEqual(formCodeManager.formInputDataTtl, inputData);
    assert.deepEqual(
      formCodeManager.getInputDataForLatestFormVersion(),
      inputData
    );
  });
});
