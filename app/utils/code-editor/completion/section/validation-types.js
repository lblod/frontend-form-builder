import { createCompletionsFor } from '../create-completion-for';

export function getValidationCompletions() {
  return createCompletionsFor(
    {
      type: `keyword`,
      section: `Validation types`,
      info: `Types of validations on fields`,
      boost: 97, // This is not doing anything IMO
    },
    [
      `a form:RequiredConstraint ;`,
      `a form:MaxLength ;`,
      `a form:PositiveNumber ;`,
      `a form:ExactValueConstraint ;`,
      `a form:ValidInteger ;`,
      `a form:ValidDateTime ;`,
      `a form:ValidDate ;`,
      `a form:ValidYear ;`,
      `a form:ValidEmail ;`,
      `a form:ValidPhoneNumber ;`,
      `a form:ValidIBAN ;`,
      `a form:ConceptSchemeConstraint ;`,
      `a form:UriConstraint ;`,
      `a form:Codelist ;`,
    ]
  );
}
