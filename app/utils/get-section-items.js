import { getMinimalNodeInfo, getRdfTypeOfNode } from './forking-store-helpers';
import { FORM, RDF, SH } from './rdflib';

export function getSectionFields(store, graph) {
  const config = [];

  const sectionSubjects = store
    .match(undefined, RDF('type'), FORM('Section'), graph)
    .map((triple) => triple.subject);

  for (const sectionSubject of sectionSubjects) {
    const nodeInfo = getMinimalNodeInfo(sectionSubject, store, graph);
    const subjectsOfGroup = store
      .match(undefined, FORM('partOf'), sectionSubject, graph)
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
      parent: sectionSubject,
      name: nodeInfo.name,
      order: nodeInfo.order,
      childs: fieldsSubjectsToDisplay,
    });
  }

  return config;
}
