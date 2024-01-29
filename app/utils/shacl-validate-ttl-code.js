import { getLocalFileContentAsText } from './get-local-file-content';
import SHACLValidator from 'rdf-validate-shacl';
import { DatasetFactory } from 'rdf-ext';
import factory from '@rdfjs/dataset';
import { Parser as ParserN3 } from 'n3';

export async function shaclValidateTtlCode(ttlCode) {
  if (!ttlCode) {
    return;
  }

  const rdf = new DatasetFactory();
  const shapesTtl = await getAllShapesTtl();

  const shapeQuads = await getQuadsFromTtlCode(shapesTtl);
  const dataQuads = await getQuadsFromTtlCode(ttlCode);

  const dataDataset = rdf.dataset(dataQuads);

  const validator = new SHACLValidator(shapeQuads, {
    allowNamedNodeInList: true,
  });
  const report = validator.validate(dataDataset);

  return report;
}

async function getAllShapesTtl() {
  const allShapes = await Promise.all([
    getLocalFileContentAsText('/SHACL/V2/repositories.ttl'),
    getLocalFileContentAsText('/SHACL/V2/field.ttl'),
    getLocalFileContentAsText('/SHACL/V2/section.ttl'),
    getLocalFileContentAsText('/SHACL/V2/required-constraint.ttl'),
    getLocalFileContentAsText('/SHACL/V2/max-characters-constraint.ttl'),
  ]);

  return allShapes.join('\n');
}

async function getQuadsFromTtlCode(ttlCode) {
  return new Promise((resolve, reject) => {
    const parser = new ParserN3();
    const dataset = factory.dataset();
    parser.parse(ttlCode, (error, quad) => {
      if (error) {
        console.warn(error);
        reject(error);
      } else if (quad) {
        dataset.add(quad);
      } else {
        resolve(dataset);
      }
    });
  });
}
