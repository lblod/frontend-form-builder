import {
  getAllUniqueSubjectsInStore,
  isSubjectReferenced,
} from 'frontend-form-builder/utils/clean-up-ttl/remove-unreferenced-subjects';
import { ForkingStore } from '@lblod/ember-submission-form-fields';
import { module, test } from 'qunit';
import { GRAPHS } from 'frontend-form-builder/controllers/formbuilder/edit';
import basicForm from './resources/remove-unreferenced-subjects/basic-form';
import basicFormWithUnreferencedField from './resources/remove-unreferenced-subjects/basic-form-with-unreferenced-field';
import { Namespace } from 'rdflib';

const NODES = new Namespace('http://data.lblod.info/form-data/nodes/');

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
  module('helper method => isSubjectReferenced', function () {
    const fieldSubject = NODES('24289e48-258f-4919-8c3e-5783a6acb4a4');
    test('field subject is referenced', function (assert) {
      // Store should be mock?
      const store = new ForkingStore();
      store.parse(basicForm, GRAPHS.sourceGraph, 'text/turtle');

      assert.true(isSubjectReferenced(fieldSubject, store));
    });
    test('field subject is unreferenced', function (assert) {
      // Store should be mock?
      const store = new ForkingStore();
      store.parse(
        basicFormWithUnreferencedField,
        GRAPHS.sourceGraph,
        'text/turtle'
      );

      assert.false(isSubjectReferenced(fieldSubject, store));
    });
  });
});
