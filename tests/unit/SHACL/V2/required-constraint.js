import { shaclValidateTtlCode } from 'frontend-form-builder/utils/shacl-validate-ttl-code';
import { module, test } from 'qunit';

module('Unit | SHACL | V2 | Required constraint', function () {
  test('is build up correctly', async function (assert) {
    const ttlCode = `
        @prefix : <#> .
        @prefix form: <http://lblod.data.gift/vocabularies/forms/> .
        @prefix nodes: <http://data.lblod.info/form-data/nodes/> .
        @prefix sh: <http://www.w3.org/ns/shacl#>.
        nodes:24289e48-258f-4919-8c3e-5783a6acb4a4
          a form:RequiredConstraint ;
          form:grouping form:Bag ;
          sh:order 1 ;
          sh:path nodes:e61f56db-6346-4a61-a75e-33e091789e40 ;
          sh:resultMessage "Dit veld is verplicht" .
      `;

    const report = await shaclValidateTtlCode(ttlCode);

    assert.true(report.conforms);
  });
  test('grouping type must be Bag NOT MatchEvery', async function (assert) {
    const ttlCode = `
        @prefix : <#> .
        @prefix form: <http://lblod.data.gift/vocabularies/forms/> .
        @prefix nodes: <http://data.lblod.info/form-data/nodes/> .
        @prefix sh: <http://www.w3.org/ns/shacl#>.
        nodes:24289e48-258f-4919-8c3e-5783a6acb4a4
          a form:RequiredConstraint ;
          form:grouping form:MatchEvery ;
          sh:order 1 ;
          sh:path nodes:e61f56db-6346-4a61-a75e-33e091789e40 ;
          sh:resultMessage "Dit veld is verplicht" .
      `;

    const report = await shaclValidateTtlCode(ttlCode);

    assert.false(report.conforms);
  });
  test('sh:resultMessage must be a string not an integer', async function (assert) {
    const ttlCode = `
        @prefix : <#> .
        @prefix form: <http://lblod.data.gift/vocabularies/forms/> .
        @prefix nodes: <http://data.lblod.info/form-data/nodes/> .
        @prefix sh: <http://www.w3.org/ns/shacl#>.
        nodes:24289e48-258f-4919-8c3e-5783a6acb4a4
          a form:RequiredConstraint ;
          form:grouping form:Bag ;
          sh:order 1 ;
          sh:path nodes:e61f56db-6346-4a61-a75e-33e091789e40 ;
          sh:resultMessage 1 .
      `;

    const report = await shaclValidateTtlCode(ttlCode);

    assert.false(report.conforms);
  });
  test('sh:path is missing in constraint', async function (assert) {
    const ttlCode = `
        @prefix : <#> .
        @prefix form: <http://lblod.data.gift/vocabularies/forms/> .
        @prefix nodes: <http://data.lblod.info/form-data/nodes/> .
        @prefix sh: <http://www.w3.org/ns/shacl#>.
        nodes:24289e48-258f-4919-8c3e-5783a6acb4a4
          a form:RequiredConstraint ;
          form:grouping form:Bag ;
          sh:order 1 ;
          sh:resultMessage "Dit veld is verplicht" .
      `;

    const report = await shaclValidateTtlCode(ttlCode);

    assert.false(report.conforms);
  });
  test('sh:resultMessage is not a required predicate', async function (assert) {
    const ttlCode = `
        @prefix : <#> .
        @prefix form: <http://lblod.data.gift/vocabularies/forms/> .
        @prefix nodes: <http://data.lblod.info/form-data/nodes/> .
        @prefix sh: <http://www.w3.org/ns/shacl#>.
        nodes:24289e48-258f-4919-8c3e-5783a6acb4a4
          a form:RequiredConstraint ;
          form:grouping form:Bag ;
          sh:order 1 ;
          sh:path nodes:e61f56db-6346-4a61-a75e-33e091789e40 .
      `;

    const report = await shaclValidateTtlCode(ttlCode);

    assert.true(report.conforms);
  });
  test('sh:resultMessage can only have one value', async function (assert) {
    const ttlCode = `
        @prefix : <#> .
        @prefix form: <http://lblod.data.gift/vocabularies/forms/> .
        @prefix nodes: <http://data.lblod.info/form-data/nodes/> .
        @prefix sh: <http://www.w3.org/ns/shacl#>.
        nodes:24289e48-258f-4919-8c3e-5783a6acb4a4
          a form:RequiredConstraint ;
          form:grouping form:Bag ;
          sh:order 1 ;
          sh:path nodes:e61f56db-6346-4a61-a75e-33e091789e40 ;
          sh:resultMessage "Dit veld is verplicht", "Second error message" .
      `;

    const report = await shaclValidateTtlCode(ttlCode);

    assert.false(report.conforms);
  });
});
