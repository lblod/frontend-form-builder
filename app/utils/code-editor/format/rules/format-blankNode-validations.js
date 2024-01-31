export async function getDocWithFormattedValidations(doc) {
  return new Promise((resolve) => {
    let newDoc = [];
    let inValidationBlankNode = false;
    for (let line = 0; line < doc.length; line++) {
      if (doc[line].localeCompare('form:validatedBy') == 0) {
        doc[line] = '\t' + doc[line];
      }
      if (doc[line].slice(-1) == '[') {
        doc[line] = '\t\t' + doc[line];
        inValidationBlankNode = true;
        newDoc.push(doc[line]);

        continue;
      }

      if (doc[line].slice(-2) == '];' || doc[line].slice(-2) == '],') {
        doc[line] = '\t\t' + doc[line].trim();
        inValidationBlankNode = false;
      }

      if (inValidationBlankNode) {
        doc[line] = '\t\t\t' + doc[line].trim();
      }

      newDoc.push(doc[line]);
    }

    resolve(newDoc);
  });
}
