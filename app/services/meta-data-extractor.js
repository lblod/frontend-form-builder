import Service from '@ember/service';

import { inject as service } from '@ember/service';
import { FORM } from '../util/rdflib';

export default class MetaDataExtractorService extends Service {
  @service database;

  async extract(store, options) {
    const { graphs } = options;
    // NOTE parse the specification for concept-schemes
    const schemes = store
      .match(undefined, FORM('options'), undefined, graphs.formGraph)
      .map((op) => JSON.parse(op.object.value))
      .filter((op) => !!op.conceptScheme)
      .map((op) => op.conceptScheme);

    // NOTE gen construct query based on concept-schemes
    const query = `
CONSTRUCT { ?s ?p ?o}
WHERE {
  VALUES ?scheme {
    ${schemes.map((scheme) => `\t<${scheme}>`).join('\n')}
    }
    ?s skos:inScheme ?scheme .
    ?s ?p ?o .
  }
`;
    const response = await this.database.query(query, {
      format: 'text/turtle',
    });
    return response.text();
  }
}
