import Model, { attr, hasMany } from '@ember-data/model';
import { RDF, SKOS } from '@lblod/submission-form-helpers';

export default class ConceptModel extends Model {
  @attr uri;
  @attr preflabel;
  @hasMany('concept-scheme', { inverse: null, async: true }) conceptSchemes;

  get label() {
    return this.preflabel;
  }

  asTtlCode(conceptSchemeUri) {
    return `
      <${this.uri}>
      ${RDF('type')} ${SKOS('Concept')} ;
      ${SKOS('prefLabel')} "${this.label}" ;
      ${SKOS('inScheme')} <${conceptSchemeUri}> .
    `;
  }
}
