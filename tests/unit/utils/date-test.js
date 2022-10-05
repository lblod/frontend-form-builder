import { isValidDate } from 'frontend-form-builder/utils/date';
import { module, test } from 'qunit';

module('Unit | Utility | date', function () {
  module('isValidDate', function () {
    test('it works', function (assert) {
      let isValid = isValidDate(new Date());
      assert.true(isValid, 'it returns `true` for a new date instance');

      isValid = isValidDate(new Date('invalid date string'));
      assert.false(isValid, 'it returns `false` for invalid dates');
    });
  });
});
