import { Statement } from 'rdflib';
import { getRdfTypeOfNode } from './forking-store-helpers';
import { getGroupingTypeLiteralForValidation } from './get-grouping-type-for-validation';
import { FORM } from './rdflib';

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
    const expectedGroupingType = getGroupingTypeLiteralForValidation(
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
