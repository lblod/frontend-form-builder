import { shaclValidateTtlCode } from 'frontend-form-builder/utils/shacl-validate-ttl-code';
import { module, test } from 'qunit';

module('Unit | Utility | validate field ttl with SHACL shape', function () {
  module('Field', function () {
    test('field has no properties', async function (assert) {
      const fieldTtlWithoutproperties = `
        @prefix : <#> .
        @prefix form: <http://lblod.data.gift/vocabularies/forms/> .
        @prefix nodes: <http://data.lblod.info/form-data/nodes/> .

        nodes:24289e48-258f-4919-8c3e-5783a6acb4a4
            a form:Field .
      `;

      const report = await shaclValidateTtlCode(fieldTtlWithoutproperties);

      assert.false(report.conforms);
    });
    test('field has missing displayType', async function (assert) {
      const fieldTtlWithoutDisplayType = `
        @prefix : <#>.
        @prefix form: <http://lblod.data.gift/vocabularies/forms/>.
        @prefix sh: <http://www.w3.org/ns/shacl#>.
        @prefix displayTypes: <http://lblod.data.gift/display-types/>.
        @prefix nodes: <http://data.lblod.info/form-data/nodes/>.
        @prefix dc: <http://purl.org/dc/terms/> .

        nodes:24289e48-258f-4919-8c3e-5783a6acb4a4
            a form:Field;
            dc:isPartOf nodes:d7b33768-3723-4291-a7be-3d8a7d7cdbc1;
            sh:name "Veldnaam";
            sh:order 2;
            sh:path nodes:e61f56db-6346-4a61-a75e-33e091789e40 .

        nodes:d7b33768-3723-4291-a7be-3d8a7d7cdbc1
        a form:Section; sh:name "Titel"; sh:order 1 .
      `;

      const report = await shaclValidateTtlCode(fieldTtlWithoutDisplayType);

      assert.false(report.conforms);
      // assert that the displayType is mssing
    });
    test('field is valid', async function (assert) {
      const validFieldTtl = `
        @prefix : <#>.
        @prefix form: <http://lblod.data.gift/vocabularies/forms/>.
        @prefix sh: <http://www.w3.org/ns/shacl#>.
        @prefix displayTypes: <http://lblod.data.gift/display-types/>.
        @prefix nodes: <http://data.lblod.info/form-data/nodes/>.
        @prefix dc: <http://purl.org/dc/terms/> .

        nodes:24289e48-258f-4919-8c3e-5783a6acb4a4
            a form:Field;
            form:displayType displayTypes:defaultInput;
            dc:isPartOf nodes:d7b33768-3723-4291-a7be-3d8a7d7cdbc1;
            sh:name "Veldnaam";
            sh:order 2;
            sh:path nodes:e61f56db-6346-4a61-a75e-33e091789e40 .

        nodes:d7b33768-3723-4291-a7be-3d8a7d7cdbc1
        a form:Section; sh:name "Titel"; sh:order 1 .
      `;

      const report = await shaclValidateTtlCode(validFieldTtl);

      assert.true(report.conforms);
    });
  });
});
