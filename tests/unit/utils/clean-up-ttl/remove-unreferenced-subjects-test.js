import {
  getAllUniqueSubjectsInStore,
  isSubjectReferenced,
} from 'frontend-form-builder/utils/clean-up-ttl/remove-unreferenced-subjects';
import { ForkingStore } from '@lblod/ember-submission-form-fields';
import { module, test } from 'qunit';
import { Namespace } from 'frontend-form-builder/utils/rdflib';
import { GRAPHS } from 'frontend-form-builder/controllers/formbuilder/edit';

module('Unit | Utility | Clean up ttl | Unreferenced subject', function () {
  module('helper method => getAllUniqueSubjectsInStore', function () {
    test('store only has unique subjects', function (assert) {
      // Store should be mock?
      const store = new ForkingStore();
      const allSubjects = store.match(
        undefined,
        undefined,
        undefined,
        GRAPHS.sourceGraph
      );
      assert.strictEqual(allSubjects.length, 2, `Store has ${2} items`);
      assert.strictEqual(
        getAllUniqueSubjectsInStore(store).length,
        1,
        `Store has ${2} unqiue item so no duplicates`
      );
    });
    test('store only has duplicate subjects', function (assert) {
      // Store should be mock?
      const store = new ForkingStore();
      const allSubjects = store.match(
        undefined,
        undefined,
        undefined,
        GRAPHS.sourceGraph
      );
      assert.strictEqual(allSubjects.length, 2, `Store has ${2} items`);
      assert.strictEqual(
        getAllUniqueSubjectsInStore(store).length,
        1,
        `Store has ${1} unqiue item so one was duplicate`
      );
    });
  });
  module('helper method => isSubjectReferenced', function () {
    test('requested subject is referenced', function (assert) {
      // Store should be mock?
      const store = new ForkingStore();
      const referencedSubject = new Namespace(
        'http://data.lblod.info/fields/myReferencedField'
      );
      assert.true(isSubjectReferenced(referencedSubject, store));
    });
    test('requested subject is not referenced', function (assert) {
      // Store should be mock?
      const store = new ForkingStore();
      const unreferencedSubject = new Namespace(
        'http://data.lblod.info/fields/myNotReferencedField'
      );
      assert.false(isSubjectReferenced(unreferencedSubject, store));
    });
  });
});
