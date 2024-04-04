import Model, { attr, hasMany } from '@ember-data/model';
import { RDF, SKOS } from '@lblod/submission-form-helpers';
import { Namespace } from 'rdflib';

const QB = new Namespace('http://purl.org/linked-data/cube#');

export default class ConceptModel extends Model {
  @attr uri;
  @attr preflabel;
  @attr order;
  @hasMany('concept-scheme', { inverse: null, async: true }) conceptSchemes;

  get label() {
    return this.preflabel;
  }

  asTtlCode(conceptSchemeUri) {
    return `
      <${this.uri}>
      ${RDF('type')} ${SKOS('Concept')} ;
      ${SKOS('prefLabel')} "${this.label}" ;
      ${QB('order')} ${this.order} ;
      ${SKOS('inScheme')} <${conceptSchemeUri}> .
    `;
  }
}
