import { shaclValidateTtlCode } from 'frontend-form-builder/utils/SHACL/shacl-validate-ttl-code';
import { module, test } from 'qunit';

module('Unit | SHACL | V2 | Valid phone number constraint', function () {
  test('is build up correctly', async function (assert) {
    const ttlCode = `
        @prefix : <#> .
        @prefix form: <http://lblod.data.gift/vocabularies/forms/> .
        @prefix nodes: <http://data.lblod.info/form-data/nodes/> .
        @prefix sh: <http://www.w3.org/ns/shacl#>.
        nodes:24289e48-258f-4919-8c3e-5783a6acb4a4
          a form:ValidPhoneNumber;
          form:defaultCountry "BE";
          form:grouping form:MatchEvery;
          sh:order 1;
          sh:path nodes:e61f56db-6346-4a61-a75e-33e091789e40;
          sh:resultMessage "Geef een geldig telefoonnummer in."@nl.
      `;

    const report = await shaclValidateTtlCode(ttlCode);

    assert.true(report.conforms);
  });
  test('grouping type must be MatchEvery NOT Bag', async function (assert) {
    const ttlCode = `
        @prefix : <#> .
        @prefix form: <http://lblod.data.gift/vocabularies/forms/> .
        @prefix nodes: <http://data.lblod.info/form-data/nodes/> .
        @prefix sh: <http://www.w3.org/ns/shacl#>.
        nodes:24289e48-258f-4919-8c3e-5783a6acb4a4
          a form:ValidPhoneNumber;
          form:defaultCountry "BE";
          form:grouping form:Bag;
          sh:order 1;
          sh:path nodes:e61f56db-6346-4a61-a75e-33e091789e40;
          sh:resultMessage "Geef een geldig telefoonnummer in."@nl.
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
          a form:ValidPhoneNumber;
          form:defaultCountry "BE";
          form:grouping form:MatchEvery;
          sh:order 1;
          sh:path nodes:e61f56db-6346-4a61-a75e-33e091789e40;
          sh:resultMessage 123.
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
          a form:ValidPhoneNumber;
          form:defaultCountry "BE";
          form:grouping form:MatchEvery;
          sh:order 1;
          sh:resultMessage "Geef een geldig telefoonnummer in."@nl.
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
          a form:ValidPhoneNumber;
          form:defaultCountry "BE";
          form:grouping form:MatchEvery;
          sh:order 1;
          sh:path nodes:e61f56db-6346-4a61-a75e-33e091789e40.
      `;

    const report = await shaclValidateTtlCode(ttlCode);

    assert.true(report.conforms);
  });
  test('predicate form:defaultCountry must be included', async function (assert) {
    const ttlCode = `
        @prefix : <#> .
        @prefix form: <http://lblod.data.gift/vocabularies/forms/> .
        @prefix nodes: <http://data.lblod.info/form-data/nodes/> .
        @prefix sh: <http://www.w3.org/ns/shacl#>.
        nodes:24289e48-258f-4919-8c3e-5783a6acb4a4
          a form:ValidPhoneNumber;
          form:grouping form:MatchEvery;
          sh:order 1;
          sh:path nodes:e61f56db-6346-4a61-a75e-33e091789e40;
          sh:resultMessage "Geef een geldig telefoonnummer in."@nl.
      `;

    const report = await shaclValidateTtlCode(ttlCode);

    assert.false(report.conforms);
  });
  test('predicate form:defaultCountry can be BE & NL', async function (assert) {
    const ttlCodeBE = `
      @prefix : <#> .
      @prefix form: <http://lblod.data.gift/vocabularies/forms/> .
      @prefix nodes: <http://data.lblod.info/form-data/nodes/> .
      @prefix sh: <http://www.w3.org/ns/shacl#>.
      nodes:24289e48-258f-4919-8c3e-5783a6acb4a4
        a form:ValidPhoneNumber;
        form:defaultCountry "BE";
        form:grouping form:MatchEvery;
        sh:order 1;
        sh:path nodes:e61f56db-6346-4a61-a75e-33e091789e40;
        sh:resultMessage "Geef een geldig telefoonnummer in."@nl.
      `;
    const ttlCodeNL = `
      @prefix : <#> .
      @prefix form: <http://lblod.data.gift/vocabularies/forms/> .
      @prefix nodes: <http://data.lblod.info/form-data/nodes/> .
      @prefix sh: <http://www.w3.org/ns/shacl#>.
      nodes:24289e48-258f-4919-8c3e-5783a6acb4a4
        a form:ValidPhoneNumber;
        form:defaultCountry "BE";
        form:grouping form:MatchEvery;
        sh:order 1;
        sh:path nodes:e61f56db-6346-4a61-a75e-33e091789e40;
        sh:resultMessage "Geef een geldig telefoonnummer in."@nl.
      `;
    const ttlCodeOtherCountry = `
      @prefix : <#> .
      @prefix form: <http://lblod.data.gift/vocabularies/forms/> .
      @prefix nodes: <http://data.lblod.info/form-data/nodes/> .
      @prefix sh: <http://www.w3.org/ns/shacl#>.
      nodes:24289e48-258f-4919-8c3e-5783a6acb4a4
        a form:ValidPhoneNumber;
        form:defaultCountry "OTHER";
        form:grouping form:MatchEvery;
        sh:order 1;
        sh:path nodes:e61f56db-6346-4a61-a75e-33e091789e40;
        sh:resultMessage "Geef een geldig telefoonnummer in."@nl.
      `;

    const reportBECountryCode = await shaclValidateTtlCode(ttlCodeBE);
    assert.true(reportBECountryCode.conforms);
    const reportNLCountryCode = await shaclValidateTtlCode(ttlCodeNL);
    assert.true(reportNLCountryCode.conforms);

    const reportOTHERCountryCode = await shaclValidateTtlCode(
      ttlCodeOtherCountry
    );
    assert.false(reportOTHERCountryCode.conforms);
  });
});
