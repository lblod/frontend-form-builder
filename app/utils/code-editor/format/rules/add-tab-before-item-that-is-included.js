export async function getDocWhereAllIncludesAreTabbed(doc) {
  return new Promise((resolve) => {
    const newDoc = [];
    const regexForFormIncludes = /^form+:includes+$/g;
    let inIncludedField = false;

    for (let line = 0; line < doc.length; line++) {
      if (doc[line].match(regexForFormIncludes)) {
        inIncludedField = true;
        newDoc.push('\t' + doc[line]);
        continue;
      }

      if (inIncludedField && doc[line].slice(-1) !== '.') {
        newDoc.push('\t\t' + doc[line]);
      } else if (inIncludedField && doc[line].slice(-1) == '.') {
        newDoc.push('\t\t' + doc[line]);
        inIncludedField = false;
      } else {
        newDoc.push(doc[line]);
      }
    }

    resolve(newDoc);
  });
}
