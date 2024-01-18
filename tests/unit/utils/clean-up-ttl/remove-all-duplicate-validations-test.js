import { getTtlWithDuplicateValidationsRemoved } from 'frontend-form-builder/utils/clean-up-ttl/remove-all-duplicate-validations';
import { module, test } from 'qunit';
import basicFormWithoutValidations from './resources/basic-form-without-validations';
import basicFormWithOneValidationOnField from './resources/basic-form-with-one-validation-on-field';
import basicFormWithDuplicateValidationOnField from './resources/basic-form-with-duplicate-validation-on-field';
import basicFormWithDuplicateValidationOnFieldResult from './resources/basic-form-with-duplicate-validation-on-field-result';

module('Unit | Utility | Clean up ttl | Duplicate validations', function () {
  module('Will not remove anything', function () {
    test('no validations in ttl', function (assert) {
      const updatedTtlCode = getTtlWithDuplicateValidationsRemoved(
        basicFormWithoutValidations
      );
      assert.deepEqual(
        stringToArray(updatedTtlCode),
        stringToArray(basicFormWithoutValidations),
        'The updated ttl code is the same as the original'
      );
    });
    test('one validation on field', function (assert) {
      const updatedTtlCode = getTtlWithDuplicateValidationsRemoved(
        basicFormWithOneValidationOnField
      );
      assert.deepEqual(
        stringToArray(updatedTtlCode),
        stringToArray(basicFormWithOneValidationOnField),
        'The updated ttl code is the same as the original'
      );
    });
  });
  module('Will remove duplicates', function () {
    test('duplicate required validation on field removed', function (assert) {
      const updatedTtlCode = getTtlWithDuplicateValidationsRemoved(
        basicFormWithDuplicateValidationOnField
      );
      assert.deepEqual(
        stringToArray(updatedTtlCode),
        stringToArray(basicFormWithDuplicateValidationOnFieldResult),
        'The duplicate required validation is removed'
      );
    });
  });
});

function stringToArray(string) {
  return string.split('\n').map((line) => line.trim());
}
