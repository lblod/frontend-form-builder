import { helper } from '@ember/component/helper';

export default helper(function isEqual([current, comparison]) {
  return current == comparison;
});
