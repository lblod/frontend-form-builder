import { getLocalFileContentAsText } from './get-local-file-content';

export async function shaclValidateTtlCode(ttlCode) {
  const fieldValidatorTtl = await getLocalFileContentAsText(
    '/SHACL/field-validator.ttl'
  );
  console.log({ ttlCode });
  console.log({ fieldValidatorTtl });
}
