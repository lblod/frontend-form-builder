import { FORM, RDF } from '@lblod/submission-form-helpers';

export function isDefaultCountryCodeAddedToValidPhoneNumber(store, graph) {
  const validPhoneNumber = store.match(
    undefined,
    RDF('type'),
    FORM('ValidPhoneNumber'),
    graph
  );

  for (const triple of validPhoneNumber) {
    const countryCodeValues = store.match(
      triple.subject,
      FORM('defaultCountry'),
      undefined,
      graph
    );

    if (!countryCodeValues.length >= 1) {
      return false;
    }
  }

  return true;
}
