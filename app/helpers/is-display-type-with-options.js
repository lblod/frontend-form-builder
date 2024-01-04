import { helper } from '@ember/component/helper';
import { DISPLAY } from '../utils/rdflib';

export default helper(function isDisplayTypeWithOptions(displayType) {
  const itemDisplayType = [...displayType][0];

  if (!itemDisplayType) {
    return false;
  }

  const selectorDisplayTypes = [
    DISPLAY('conceptSchemeMultiSelectCheckboxes').value,
    DISPLAY('conceptSchemeMultiSelector').value,
    DISPLAY('conceptSchemeRadioButtons').value,
    DISPLAY('conceptSchemeSelector').value,
  ];

  if (selectorDisplayTypes.includes(itemDisplayType.value)) {
    return true;
  }

  return false;
});
