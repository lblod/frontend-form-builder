import { FORM } from '@lblod/submission-form-helpers';

export function isValidationConfigValidForType(config) {
  console.log(`isValidatioNConfigValidaForType | config`, config);
  if (!config || !config.type) {
    return false;
  }

  const type = config.type;
  const validate = getValidatorForType(type);

  return validate(config);
}

function getValidatorForType(type) {
  const uri = type.value;

  switch (uri) {
    case FORM('MaxLength').value:
      return isValidForMaxLength;

    default:
      return isValidBecauseNoRequirements;
  }
}

function isValidBecauseNoRequirements(config) {
  if (config.type) return true;

  return false;
}

function isValidForMaxLength(config) {
  if (config.max && !isNaN(config.max)) return true;

  return false;
}
