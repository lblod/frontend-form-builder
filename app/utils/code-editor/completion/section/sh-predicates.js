import { createCompletionsFor } from '../create-completion-for';

export function getShaclPredicateCompletions() {
  return createCompletionsFor(
    {
      type: `keyword`,
      section: `SHACL`,
      info: `Form predicates`,
      boost: 98, // This is not doing anything IMO
    },
    [
      `sh:name`,
      `sh:order`,
      `sh:path`,
      `sh:description """"""`,
      `sh:resultMessage ""`,
    ]
  );
}
