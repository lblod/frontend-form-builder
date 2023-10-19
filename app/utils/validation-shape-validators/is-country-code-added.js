import { FORM, RDF } from '../rdflib';

export function isDefaultCountryCodeAddedToValidPhoneNumber(store, graph) {
  const validPhoneNumber = store.match(
    undefined,
    RDF('type'),
    FORM('ValidPhoneNumber'),
    graph
  );

  const subjectsToAddDefaultTo = [];
  for (const triple of validPhoneNumber) {
    const countryCodeValues = store.match(
      triple.subject,
      FORM('defaultCountry'),
      undefined,
      graph
    );

    if (!countryCodeValues.length >= 1) {
      subjectsToAddDefaultTo.push(triple.subject);
    }
  }

  return {
    isAdded: subjectsToAddDefaultTo.length == 0,
    subjectsToAddDefaultTo: subjectsToAddDefaultTo,
  };
}
