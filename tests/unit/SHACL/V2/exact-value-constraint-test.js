import { shaclValidateTtlCode } from 'frontend-form-builder/utils/SHACL/shacl-validate-ttl-code';
import { module, test } from 'qunit';

module('Unit | SHACL | V2 | Exact value constraint', function () {
  test('is build up correctly', async function (assert) {
    const ttlCode = `
        @prefix : <#> .
        @prefix form: <http://lblod.data.gift/vocabularies/forms/> .
        @prefix nodes: <http://data.lblod.info/form-data/nodes/> .
        @prefix sh: <http://www.w3.org/ns/shacl#>.
        nodes:24289e48-258f-4919-8c3e-5783a6acb4a4
          a form:ExactValueConstraint;
          form:customValue "12";
          form:grouping form:MatchSome;
          sh:order 1;
          sh:path nodes:e61f56db-6346-4a61-a75e-33e091789e40;
          sh:resultMessage "Dit veld is verplicht" .
      `;

    const report = await shaclValidateTtlCode(ttlCode);

    assert.true(report.conforms);
  });
  test('grouping type must be MatchSome NOT MatchEvery', async function (assert) {
    const ttlCode = `
        @prefix : <#> .
        @prefix form: <http://lblod.data.gift/vocabularies/forms/> .
        @prefix nodes: <http://data.lblod.info/form-data/nodes/> .
        @prefix sh: <http://www.w3.org/ns/shacl#>.
        nodes:24289e48-258f-4919-8c3e-5783a6acb4a4
          a form:ExactValueConstraint;
          form:customValue "12";
          form:grouping form:MatchEvery;
          sh:order 1;
          sh:path nodes:e61f56db-6346-4a61-a75e-33e091789e40;
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
          a form:ExactValueConstraint;
          form:customValue "12";
          form:grouping form:MatchSome;
          sh:order 1;
          sh:path nodes:e61f56db-6346-4a61-a75e-33e091789e40;
          sh:resultMessage 123 .
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
          a form:ExactValueConstraint;
          form:customValue "12";
          form:grouping form:MatchSome;
          sh:order 1;
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
          a form:ExactValueConstraint;
          form:customValue "12";
          form:grouping form:MatchSome;
          sh:order 1;
          sh:path nodes:e61f56db-6346-4a61-a75e-33e091789e40.
      `;

    const report = await shaclValidateTtlCode(ttlCode);

    assert.true(report.conforms);
  });
  test('predicate form:customValue must be included', async function (assert) {
    const ttlCode = `
        @prefix : <#> .
        @prefix form: <http://lblod.data.gift/vocabularies/forms/> .
        @prefix nodes: <http://data.lblod.info/form-data/nodes/> .
        @prefix sh: <http://www.w3.org/ns/shacl#>.
        nodes:24289e48-258f-4919-8c3e-5783a6acb4a4
          a form:ExactValueConstraint;
          form:grouping form:MatchSome;
          sh:order 1;
          sh:path nodes:e61f56db-6346-4a61-a75e-33e091789e40;
          sh:resultMessage "Dit veld is verplicht" .
      `;

    const report = await shaclValidateTtlCode(ttlCode);

    assert.false(report.conforms);
  });
  test('predicate form:customValue cannot be a number', async function (assert) {
    const ttlCode = `
        @prefix : <#> .
        @prefix form: <http://lblod.data.gift/vocabularies/forms/> .
        @prefix nodes: <http://data.lblod.info/form-data/nodes/> .
        @prefix sh: <http://www.w3.org/ns/shacl#>.
        nodes:24289e48-258f-4919-8c3e-5783a6acb4a4
          a form:ExactValueConstraint;
          form:customValue 12;
          form:grouping form:MatchSome;
          sh:order 1;
          sh:path nodes:e61f56db-6346-4a61-a75e-33e091789e40;
          sh:resultMessage "Dit veld is verplicht" .
      `;

    const report = await shaclValidateTtlCode(ttlCode);

    assert.false(report.conforms);
  });
});
