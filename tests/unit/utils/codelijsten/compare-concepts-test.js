import { isConceptListChanged } from 'frontend-form-builder/utils/codelijsten/compare-concepts';
import { module, test } from 'qunit';

module('Unit | Utility | Codelijsten', function () {
  module('compare against empty array', function () {
    test('both arrays are empty and so unchanged', function (assert) {
      const dbConcepts = [];
      const concepts = [];

      assert.false(isConceptListChanged(dbConcepts, concepts));
    });
    test('db array has more items than the current', function (assert) {
      const dbConcepts = [
        {
          id: 'conceptId',
          label: '',
        },
      ];
      const concepts = [];

      assert.true(isConceptListChanged(dbConcepts, concepts));
    });
    test('current array has more items than the db array', function (assert) {
      const dbConcepts = [];
      const concepts = [
        {
          id: 'conceptId',
          label: '',
        },
      ];

      assert.true(isConceptListChanged(dbConcepts, concepts));
    });
  });
  module('compare to arrays with items', function () {
    test('comparing the same array results in no changes', function (assert) {
      const dbConcepts = [
        {
          id: 'conceptId',
          label: '',
        },
      ];

      assert.false(isConceptListChanged(dbConcepts, dbConcepts));
    });
    test('label of concept is updated results in change', function (assert) {
      const dbConcepts = [
        {
          id: 'conceptId',
          label: 'dbLabel',
        },
      ];
      const concepts = [
        {
          id: 'conceptId',
          label: 'label',
        },
      ];

      assert.true(isConceptListChanged(dbConcepts, concepts));
    });
  });
});
