import { FORM } from '@lblod/submission-form-helpers';

export function isValidationConfigValidForType(config) {
  if (!config || !config.type) {
    return false;
  }

  const type = config.type.object;
  const validate = getValidatorForType(type);

  return validate(config);
}

function getValidatorForType(type) {
  const uri = type.value;

  switch (uri) {
    case FORM('MaxLength').value:
      return isValidForMaxLength;
    case FORM('ExactValueConstraint').value:
      return isValidForExactValue;
    case FORM('ValidPhoneNumber').value:
      return isValidForPhoneNumber;

    default:
      return isValidBecauseNoRequirements;
  }
}

function isValidBecauseNoRequirements(config) {
  if (config.type) return true;

  return false;
}

function isValidForMaxLength(config) {
  if (config.max && config.max.object !== null) {
    if (parseInt(config.max.object.value) > 0) {
      return true;
    }

    return false;
  }

  return false;
}

function isValidForExactValue(config) {
  if (config.customValue && config.customValue.object !== null) return true;

  return false;
}

function isValidForPhoneNumber(config) {
  if (config.countryCode && config.countryCode.object !== null) return true;

  return false;
}
