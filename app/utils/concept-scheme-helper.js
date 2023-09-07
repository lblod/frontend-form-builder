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

  getValidationNameOfConceptByPropertyValue(propertyValue) {
    for (const concept of this.concepts) {
      const propertyKeys = Object.keys(concept);
      if (propertyKeys.includes('validationName')) {
        for (const key of propertyKeys) {
          if (concept[key].value == propertyValue) {
            return concept.validationName.value;
          }
        }
      }
    }

    throw `Could not find a 'validation name' for concept with property value: ${propertyValue}`;
  }
}
