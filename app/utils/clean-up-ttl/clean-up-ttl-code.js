import { getTtlWithCleanUpFieldOptions } from './clean-up-field-options';
import { getTtlWithUnReferencedSubjectsRemoved } from './remove-unreferenced-subjects';

export function cleanupTtlcode(ttlCode, toasterService) {
  let updatedTtl = getTtlWithUnReferencedSubjectsRemoved(
    ttlCode,
    toasterService
  );
  return getTtlWithCleanUpFieldOptions(updatedTtl);
}
