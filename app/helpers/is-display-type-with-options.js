import { helper } from '@ember/component/helper';
import { canDisplayTypeHaveFormOptions } from '../utils/can-display-type-have-form-options';

export default helper(function isDisplayTypeWithOptions(displayType) {
  const itemDisplayType = [...displayType][0];

  if (!itemDisplayType) {
    return false;
  }

  return canDisplayTypeHaveFormOptions(itemDisplayType);
});
