import { sortObjectsOnProperty } from 'frontend-form-builder/utils/sort-object-on-property';
import { module, test } from 'qunit';

module('Unit | Utility | sortObjectsOnProperty', function () {
  module('can sort', function () {
    test('ascending on property label', function (assert) {
      const objects = [
        {
          label: 'z',
        },
        {
          label: 'n',
        },
        {
          label: 'a',
        },
      ];

      const sortedObjects = [
        {
          label: 'a',
        },
        {
          label: 'n',
        },
        {
          label: 'z',
        },
      ];

      assert.deepEqual(sortObjectsOnProperty(objects, 'label'), sortedObjects);
    });
    test('descending on property label', function (assert) {
      const sortAscending = false;
      const objects = [
        {
          label: 'a',
        },
        {
          label: 'n',
        },
        {
          label: 'z',
        },
      ];

      const sortedObjects = [
        {
          label: 'z',
        },
        {
          label: 'n',
        },
        {
          label: 'a',
        },
      ];

      assert.deepEqual(
        sortObjectsOnProperty(objects, 'label', sortAscending),
        sortedObjects
      );
    });
    test('ascending on property with mixed capital letter', function (assert) {
      const objects = [
        {
          label: 'z',
        },
        {
          label: 'A',
        },
        {
          label: 'a',
        },
      ];

      const sortedObjects = [
        {
          label: 'A',
        },
        {
          label: 'a',
        },
        {
          label: 'z',
        },
      ];

      assert.deepEqual(sortObjectsOnProperty(objects, 'label'), sortedObjects);
    });
  });
});
