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

  const shapeQuads = await parse(shapesTtl);
  const dataQuads = await parse(ttlCode);

  const dataDataset = rdf.dataset(dataQuads);

  const validator = new SHACLValidator(shapeQuads, {
    allowNamedNodeInList: true,
  });
  const report = validator.validate(dataDataset);

  return report;
}

async function getAllShapesTtl() {
  const allShapes = await Promise.all([
    getLocalFileContentAsText('/SHACL/repositories.ttl'),
    getLocalFileContentAsText('/SHACL/field-shape.ttl'),
    getLocalFileContentAsText('/SHACL/section-shape.ttl'),
  ]);

  return allShapes.join('\n');
}

async function parse(triples) {
  return new Promise((resolve, reject) => {
    const parser = new ParserN3();
    const dataset = factory.dataset();
    parser.parse(triples, (error, quad) => {
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
