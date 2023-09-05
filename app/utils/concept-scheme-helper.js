export default class ConceptSchemeHelper {
  constructor(concepts) {
    this.concepts = concepts;
  }

  static createEmpty() {
    return new this([]);
  }

  getAll() {
    return this.concepts;
  }

  addConcepts(concepts) {
    this.concepts.push(...concepts);
  }

  getMappedConceptPropertyValues(property) {
    return this.concepts.map((concept) => {
      return concept[property].value;
    });
  }

  // Not a fan of this
  getUuidOfConceptByPropertyValue(propertyValue) {
    for (const concept of this.concepts) {
      const propertyKeys = Object.keys(concept);
      if (propertyKeys.includes('uuid')) {
        for (const key of propertyKeys) {
          if (concept[key].value == propertyValue) {
            return concept.uuid.value;
          }
        }
      }
    }

    throw `Could not find a concept with property value: ${propertyValue}`;
  }
}
