import { createCompletionsFor } from '../create-completion-for';

export function getFormPredicateCompletions() {
  return createCompletionsFor(
    {
      type: `keyword`,
      section: `Form`,
      info: `Form predicates`,
      boost: 98, // This is not doing anything IMO
    },
    [
      `form:displayType `,
      `form:grouping `,
      `form:validations [] ;`,
      `form:help """""" ;`,
    ]
  );
}
