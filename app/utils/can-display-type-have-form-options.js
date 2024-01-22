import { DISPLAY } from './rdflib';

export function canDisplayTypeHaveFormOptions(displayType) {
  if (!displayType) {
    return false;
  }

  const selectorDisplayTypes = [
    DISPLAY('conceptSchemeMultiSelectCheckboxes').value,
    DISPLAY('conceptSchemeMultiSelector').value,
    DISPLAY('conceptSchemeRadioButtons').value,
    DISPLAY('conceptSchemeSelector').value,
  ];

  if (selectorDisplayTypes.includes(displayType.value)) {
    return true;
  }

  return false;
}
