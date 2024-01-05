import { ForkingStore } from '@lblod/ember-submission-form-fields';
import { FORM } from '../rdflib';
import { GRAPHS } from '../../controllers/formbuilder/edit';
import {
  getRdfTypeOfNode,
  getTriplesWithNodeAsSubject,
} from '../forking-store-helpers';

export function getTtlWithDuplicateValidationsRemoved(ttlCode) {
  const store = new ForkingStore();
  store.parse(ttlCode, GRAPHS.sourceGraph, 'text/turtle');

  const validations = store.match(
    undefined,
    FORM('validations'),
    undefined,
    GRAPHS.sourceGraph
  );

  const mappedValidationsForSubjects =
    getMappedValidationSubjectsPerNode(validations);
  for (const subjectWithValidations of mappedValidationsForSubjects) {
    const validationSubjectsToRemove = getValidationSubjectToRemove(
      subjectWithValidations.subject,
      subjectWithValidations.validationSubjects,
      store
    );

    for (const subjectToRemove of validationSubjectsToRemove) {
      const foundValidationNodeToRemove = store.match(
        subjectWithValidations.subject,
        FORM('validations'),
        subjectToRemove,
        GRAPHS.sourceGraph
      );
      if (!foundValidationNodeToRemove) {
        console.error(
          `Could not get validation to remove of node`,
          subjectWithValidations.subject,
          subjectToRemove
        );
        continue;
      }

      store.removeStatements([
        ...foundValidationNodeToRemove,
        ...getTriplesWithNodeAsSubject(
          subjectToRemove,
          store,
          GRAPHS.sourceGraph
        ),
      ]);
    }
  }
  return store.serializeDataMergedGraph(GRAPHS.sourceGraph);
}

function getMappedValidationSubjectsPerNode(validations) {
  const validationsPerSubject = [];
  const subjects = validations.map((validation) => validation.subject.value);
  const uniqueSubjects = new Array(...new Set(subjects));

  const config = [];
  for (const validation of validations) {
    const index = validation.subject.value;
    if (!config[index]) {
      config[index] = {
        subject: validation.subject,
        validationSubjects: [],
      };
    }

    config[index].validationSubjects.push(validation.object);
  }

  for (const validationSubject of uniqueSubjects) {
    validationsPerSubject.push(config[validationSubject]);
  }

  return validationsPerSubject;
}

function getValidationSubjectToRemove(subject, validationSubjects, store) {
  const rdfTypesToKeep = [];

  return validationSubjects.filter((subject) => {
    const rdfType = getRdfTypeOfNode(subject, store, GRAPHS.sourceGraph);

    if (!rdfTypesToKeep.includes(rdfType.value)) {
      rdfTypesToKeep.push(rdfType.value);
      return false;
    }

    return true;
  });
}
