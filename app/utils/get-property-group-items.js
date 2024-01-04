import { getMinimalNodeInfo, getRdfTypeOfNode } from './forking-store-helpers';
import { FORM, RDF, SH } from './rdflib';

export function getPropertyGroupFields(store, graph) {
  const config = [];

  const propertyGroupSubjects = store
    .match(undefined, RDF('type'), FORM('PropertyGroup'), graph)
    .map((triple) => triple.subject);

  for (const propertyGroupSubject of propertyGroupSubjects) {
    const nodeInfo = getMinimalNodeInfo(propertyGroupSubject, store, graph);
    const subjectsOfGroup = store
      .match(undefined, SH('group'), propertyGroupSubject, graph)
      .map((triple) => triple.subject);

    const fieldsSubjectsToDisplay = [];
    for (const subjectInGroup of subjectsOfGroup) {
      const rdfType = getRdfTypeOfNode(subjectInGroup, store, graph);

      if (rdfType.value != FORM('Field').value) {
        console.warn(`Only fields are supported to be displayed per section`);
        continue;
      }
      fieldsSubjectsToDisplay.push(subjectInGroup);
    }

    config.push({
      parent: propertyGroupSubject,
      name: nodeInfo.name,
      order: nodeInfo.order,
      childs: fieldsSubjectsToDisplay,
    });
  }

  return config;
}
