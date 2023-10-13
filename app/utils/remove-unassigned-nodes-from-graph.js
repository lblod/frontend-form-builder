import {
  getAllTriples,
  getTriplesWithNodeAsObject,
  getTriplesWithNodeAsSubject,
} from './forking-store-helpers';

export function removeUnassignedNodesFromGraph(exception, store, graph) {
  const subjectsInForm = getAllTriples(store, graph).map(
    (triple) => triple.subject
  );
  const uniqueSubjects = new Array(...new Set(subjectsInForm));

  const subjectsWithoutExceptions = uniqueSubjects.filter(
    (statement) => statement.value !== exception.value
  );

  for (const subject of subjectsWithoutExceptions) {
    const matchesInObject = getTriplesWithNodeAsObject(subject, store, graph);

    if (matchesInObject.length == 0 || !matchesInObject) {
      try {
        const subjectTriples = getTriplesWithNodeAsSubject(
          subject,
          store,
          graph
        );

        store.removeStatements(subjectTriples);
      } catch (error) {
        console.error(
          `Could not remove subject with predicates for`,
          subject,
          error
        );
      }
    }
  }
}
