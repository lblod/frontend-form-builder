import { Statement } from 'rdflib';
import { getRdfTypeOfNode } from './forking-store-helpers';
import { getGroupingTypeForValidation } from './get-grouping-type-for-validation';
import { FORM } from './rdflib';

/**
 * Validation nodes have a predicate named `form:grouping`.
 * These validations nodes are generated and so we cannot add the type dynamically depending
 *  on the validation type (RDF-type). In the form.ttl file under validation you can see that
 *  `form:Bag` is the default grouping  value.
 * To fix this we are checking what the current and the expected grouping type is for the
 *  selected validation. If the current value is not as expected it is updated.
 *
 */
export function updateGroupingTypesOnValidations(store, graphs) {
  const triplesWithGroupingType = store.match(
    undefined,
    FORM('grouping'),
    undefined,
    graphs.sourceGraph
  );

  const subjectsThatHaveGroupingType = triplesWithGroupingType.map(
    (triple) => triple.subject
  );

  const uniqueSubjects = new Array(...new Set(subjectsThatHaveGroupingType));

  for (const subject of uniqueSubjects) {
    const validationType = getRdfTypeOfNode(subject, store, graphs.sourceGraph);
    const currentGroupingType = store.any(
      subject,
      FORM('grouping'),
      undefined,
      graphs.sourceGraph
    );
    const expectedGroupingType = getGroupingTypeForValidation(
      validationType,
      store,
      graphs.metaGraph
    );
    if (currentGroupingType.value !== expectedGroupingType.value) {
      store.removeStatements([
        new Statement(
          subject,
          FORM('grouping'),
          currentGroupingType,
          graphs.sourceGraph
        ),
      ]);

      const updatedGroupingType = new Statement(
        subject,
        FORM('grouping'),
        expectedGroupingType,
        graphs.sourceGraph
      );
      store.addAll([updatedGroupingType]);
    }
  }
}
