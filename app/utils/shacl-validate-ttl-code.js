import { Validator } from 'shacl-engine';
import rdfDataset from '@rdfjs/dataset';
import rdfDataModel from '@rdfjs/data-model';
import { getLocalFileContentAsText } from './get-local-file-content';
import { ForkingStore } from '@lblod/ember-submission-form-fields';
import { GRAPHS } from '../controllers/formbuilder/edit';

export async function shaclValidateTtlCode(ttlCode) {
  const fieldValidatorTtl = await getLocalFileContentAsText(
    '/SHACL/field-validator.ttl'
  );

  const shapeDataset = rdfDataset.dataset();
  shapeDataset.add(...getAllStatementsForTtlCode(fieldValidatorTtl));
  const dataset = rdfDataset.dataset();
  dataset.add(...getAllStatementsForTtlCode(ttlCode));

  const validator = new Validator(shapeDataset, { factory: rdfDataModel });
  const report = await validator.validate({ dataset });

  console.log('report:', report);
  console.log(`conforms: ${report.conforms}`);
}

function getAllStatementsForTtlCode(ttlCode) {
  const storeToPrepareDataset = new ForkingStore();
  storeToPrepareDataset.parse(ttlCode, GRAPHS.sourceGraph, 'text/turtle');

  return storeToPrepareDataset.match(
    undefined,
    undefined,
    undefined,
    GRAPHS.sourceGraph
  );
}
