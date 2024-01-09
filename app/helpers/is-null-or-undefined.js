import { helper } from '@ember/component/helper';

export default helper(function IsNullOrUndefined([value]) {
  return value == undefined || value == null;
});
