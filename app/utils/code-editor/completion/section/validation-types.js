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
      `form:RequiredConstraint`,
      `form:MaxLength`,
      `form:PositiveNumber`,
      `form:ExactValueConstraint`,
      `form:ValidInteger`,
      `form:ValidDateTime`,
      `form:ValidDate`,
      `form:ValidYear`,
      `form:ValidEmail`,
      `form:ValidPhoneNumber`,
      `form:ValidIBAN`,
      `form:ConceptSchemeConstraint`,
      `form:UriConstraint`,
      `form:Codelist`,
    ]
  );
}
