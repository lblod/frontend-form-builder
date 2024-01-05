import {
  getAllUniqueSubjectsInStore,
  isSubjectReferenced,
} from 'frontend-form-builder/utils/clean-up-ttl/remove-unreferenced-subjects';
import { ForkingStore } from '@lblod/ember-submission-form-fields';
import { module, test } from 'qunit';
import { Namespace } from 'frontend-form-builder/utils/rdflib';
import { GRAPHS } from 'frontend-form-builder/controllers/formbuilder/edit';
import basicForm from './resources/remove-unreferenced-subjects/basic-form';

module('Unit | Utility | Clean up ttl | Unreferenced subject', function () {
  module('helper method => getAllUniqueSubjectsInStore', function () {
    test('can get the subjects of the store', function (assert) {
      // Store should be mock?
      const store = new ForkingStore();
      store.parse(basicForm, GRAPHS.sourceGraph, 'text/turtle');
      const predicatesInTtl = 13;
      const uniqueSubjectsInTtl = 3;
      const allFoundSubjects = store.match(
        undefined,
        undefined,
        undefined,
        GRAPHS.sourceGraph
      );
      assert.strictEqual(
        allFoundSubjects.length,
        predicatesInTtl,
        `Store has ${predicatesInTtl} predicates`
      );
      assert.strictEqual(
        getAllUniqueSubjectsInStore(store).length,
        uniqueSubjectsInTtl,
        `Store has ${uniqueSubjectsInTtl} subjects so no duplicates`
      );
    });
  });
  // module('helper method => isSubjectReferenced', function () {
  //   test('requested subject is referenced', function (assert) {
  //     // Store should be mock?
  //     const store = new ForkingStore();
  //     const referencedSubject = new Namespace(
  //       'http://data.lblod.info/fields/myReferencedField'
  //     );
  //     assert.true(isSubjectReferenced(referencedSubject, store));
  //   });
  //   test('requested subject is not referenced', function (assert) {
  //     // Store should be mock?
  //     const store = new ForkingStore();
  //     const unreferencedSubject = new Namespace(
  //       'http://data.lblod.info/fields/myNotReferencedField'
  //     );
  //     assert.false(isSubjectReferenced(unreferencedSubject, store));
  //   });
  // });
});
