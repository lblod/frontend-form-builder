import { getFormPredicateCompletions } from './sections/form-predicates';
import { getFormTypeCompletions } from './sections/form-types';
import { getPrefixCompletions } from './sections/prefixes';
import { getShaclPredicateCompletions } from './sections/sh-predicates';

export default [
  ...getFormTypeCompletions(),
  ...getFormPredicateCompletions(),
  ...getShaclPredicateCompletions(),
  ...getPrefixCompletions(),
];
