import { module, test } from 'qunit';
import { setupTest } from 'frontend-form-builder/tests/helpers';
import versionOneForm from './resources/version-one-form';
import versionTwoForm from './resources/version-two-form';
import versionOneAndTwoCombinationForm from './resources/version-one-and-two-combination-form';

module('Unit | Service | form-version', function (hooks) {
  setupTest(hooks);

  test('Service is found', function (assert) {
    let service = this.owner.lookup('service:form-version');
    assert.ok(service);
  });

  test('Versions are defined correctly', function (assert) {
    let service = this.owner.lookup('service:form-version');

    assert.deepEqual(service.VERSION_ONE, 'V1');
    assert.deepEqual(service.VERSION_TWO, 'V2');
    assert.deepEqual(service.VERSION_UNDETERMINED, 'UNKNOWN');
  });

  test('Can detect a V1 form', function (assert) {
    let service = this.owner.lookup('service:form-version');
    const vOneForm = versionOneForm;

    assert.true(service.isVersionOneForm(vOneForm));
    assert.false(service.isVersionTwoForm(vOneForm));
    assert.deepEqual(service.getVersionForTtl(vOneForm), service.VERSION_ONE);
  });

  test('Can detect a V2 form', function (assert) {
    let service = this.owner.lookup('service:form-version');
    const vTwoForm = versionTwoForm;

    assert.true(service.isVersionTwoForm(vTwoForm));
    assert.false(service.isVersionOneForm(vTwoForm));
    assert.deepEqual(service.getVersionForTtl(vTwoForm), service.VERSION_TWO);
  });

  test('Combination of V1 & 2V forms is version undertermined', function (assert) {
    let service = this.owner.lookup('service:form-version');
    const combinationOfVersionOneAndTwo = versionOneAndTwoCombinationForm;

    assert.true(
      service.isCombinationOfOneAndTwo(combinationOfVersionOneAndTwo)
    );
    assert.true(service.isVersionTwoForm(combinationOfVersionOneAndTwo));
    assert.true(service.isVersionOneForm(combinationOfVersionOneAndTwo));
    assert.deepEqual(
      service.getVersionForTtl(combinationOfVersionOneAndTwo),
      service.VERSION_UNDETERMINED
    );
  });

  test('If version cannot be determined it returns unknown', function (assert) {
    let service = this.owner.lookup('service:form-version');
    const underterminedTtlCode = ``;

    assert.false(service.isCombinationOfOneAndTwo(underterminedTtlCode));
    assert.false(service.isVersionTwoForm(underterminedTtlCode));
    assert.false(service.isVersionOneForm(underterminedTtlCode));
    assert.deepEqual(
      service.getVersionForTtl(underterminedTtlCode),
      service.VERSION_UNDETERMINED
    );
  });
});
