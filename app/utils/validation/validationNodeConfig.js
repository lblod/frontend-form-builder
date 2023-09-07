import { EXT, FORM, RDF, SH } from '../rdflib';

export class ValidationsNodeConfig {
  constructor(config) {
    // TODO: check if config is an array of `ValidationNodeConfig`
    this.config = config;
  }

  getConfigurationForValidationType(validationType) {
    for (const nodeConfig of this.config) {
      if (nodeConfig.name == validationType) {
        return nodeConfig;
      }
    }

    throw `Validation type: '${validationType}' not found in config.`;
  }
}

export class ValidationNodeConfig {
  constructor(name, predicateValueArray) {
    // TODO: add validation that checks if it is a collection

    this.name = name;
    this.predicateValueArray = predicateValueArray; // TODO: create a collection
  }

  getPredicateValueArray() {
    return this.predicateValueArray;
  }
}

export class PredicateWithValue {
  constructor(predicate, value) {
    this.predicate = predicate;
    this.value = value;
  }

  static create(predicate, value) {
    return new this(predicate, value);
  }
}

export const VALIDATION_NODES_CONFIG = [
  new ValidationNodeConfig('RequiredConstraint', [
    PredicateWithValue.create(RDF('type'), FORM('RequiredConstraint')),
    PredicateWithValue.create(FORM('grouping'), FORM('Bag')),
    PredicateWithValue.create(SH('resultMessage'), 'Dit veld is verplicht.'),
  ]),
  new ValidationNodeConfig('MaxLength', [
    PredicateWithValue.create(RDF('type'), FORM('MaxLength')),
    PredicateWithValue.create(FORM('grouping'), FORM('MatchEvery')),
    PredicateWithValue.create(FORM('max'), '20'),
    PredicateWithValue.create(
      SH('resultMessage'),
      'Maximum karakters overschreden.'
    ),
  ]),
];
