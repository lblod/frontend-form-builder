import { Namespace } from 'rdflib';

export const DISPLAY = new Namespace('http://lblod.data.gift/display-types/');

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
