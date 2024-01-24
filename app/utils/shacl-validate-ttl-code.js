import { getLocalFileContentAsText } from './get-local-file-content';
import { ForkingStore } from '@lblod/ember-submission-form-fields';
import { GRAPHS } from '../controllers/formbuilder/edit';
import SHACLValidator from 'rdf-validate-shacl';
import { DatasetFactory } from 'rdf-ext';

export async function shaclValidateTtlCode(ttlCode) {
  const fieldValidatorTtl = await getLocalFileContentAsText(
    '/SHACL/field-validator.ttl'
  );

  const shapeQuads = getAllStatementsForTtlCode(fieldValidatorTtl);
  const dataQuads = getAllStatementsForTtlCode(ttlCode);

  const shapeDataset = new DatasetFactory().dataset(shapeQuads);
  const dataDataset = new DatasetFactory().dataset(dataQuads);

  const validator = new SHACLValidator(shapeDataset);
  const report = validator.validate(dataDataset);

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
