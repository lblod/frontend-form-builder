import { GRAPHS } from '../../controllers/formbuilder/edit';
import { ForkingStore } from '@lblod/ember-submission-form-fields';
import { FORM, RDF } from '../rdflib';
import { canDisplayTypeHaveFormOptions } from '../can-display-type-have-form-options';
import { Statement } from 'rdflib';

export function getTtlWithCleanUpFieldOptions(ttlCode) {
  return removeConceptschemeFromFieldOptions(ttlCode);
}

function removeConceptschemeFromFieldOptions(ttlCode) {
  let hasTtlChanged = false;
  const store = new ForkingStore();
  store.parse(ttlCode, GRAPHS.sourceGraph, 'text/turtle');

  const fieldSubjects = store
    .match(undefined, RDF('type'), FORM('Field'), GRAPHS.sourceGraph)
    .map((triple) => triple.subject);

  for (const subject of fieldSubjects) {
    const displayType = store.any(
      subject,
      FORM('displayType'),
      undefined,
      GRAPHS.sourceGraph
    );

    if (canDisplayTypeHaveFormOptions(displayType)) {
      continue;
    }

    const formOptions = store.any(
      subject,
      FORM('options'),
      undefined,
      GRAPHS.sourceGraph
    );

    if (!formOptions) {
      return;
    }

    let formOptionsAsJson = {};
    try {
      formOptionsAsJson = JSON.parse(formOptions);
    } catch (error) {
      console.error(`Kan de form:options niet parse naar json`, error);
      continue;
    }

    if (formOptionsAsJson['conceptScheme']) {
      hasTtlChanged = true;
      delete formOptionsAsJson.conceptScheme;
    }

    store.removeStatements([
      new Statement(subject, FORM('options'), formOptions, GRAPHS.sourceGraph),
    ]);

    if (Object.keys(formOptionsAsJson).length !== 0) {
      store.addAll([
        new Statement(
          subject,
          FORM('options'),
          JSON.stringify(formOptionsAsJson),
          GRAPHS.sourceGraph
        ),
      ]);
    }
  }

  return hasTtlChanged
    ? store.serializeDataMergedGraph(GRAPHS.sourceGraph)
    : ttlCode;
}
