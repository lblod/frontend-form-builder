import { getTtlWithDuplicateValidationsRemoved } from 'frontend-form-builder/utils/clean-up-ttl/remove-all-duplicate-validations';
import { module, test } from 'qunit';
import basicFormWithoutValidations from './resources/basic-form-without-validations';

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
  });
});

function stringToArray(string) {
  return string.split('\n').map((line) => line.trim());
}
