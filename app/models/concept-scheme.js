import Model, { attr, hasMany } from '@ember-data/model';
import { RDF, SKOS } from '@lblod/submission-form-helpers';

export default class ConceptSchemeModel extends Model {
  @attr uri;
  @attr('datetime') createdat;
  @attr preflabel;
  @attr description;
  @attr ispublic;
  @attr isarchived;
  @hasMany('concept', { inverse: null, async: true }) concepts;

  get label() {
    return this.preflabel;
  }

  get isPublic() {
    return this.ispublic;
  }

  get isArchived() {
    return this.isarchived ?? false;
  }

  get createdAt() {
    return this.createdat ?? null;
  }

  asTtlCode() {
    return `
      <${this.uri}>
      ${RDF('type')} ${SKOS('ConceptScheme')} ;
      ${SKOS('prefLabel')} "${this.label}" .
    `;
  }

  async modelWithConceptsAsTtlCode() {
    const schemeTtlCode = this.asTtlCode();
    const ttlCodeArray = [];

    for (const concept of await this.getConceptModels()) {
      ttlCodeArray.push(concept.asTtlCode(this.uri));
    }

    return [...ttlCodeArray, schemeTtlCode].join(' ');
  }

  async getConceptModels() {
    const concepts = await this.concepts;

    return [...concepts];
  }
}
