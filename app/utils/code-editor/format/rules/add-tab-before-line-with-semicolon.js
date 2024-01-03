export function getDocWithTabBeforeLineWithSemicolon(doc) {
  return new Promise((resolve) => {
    let newDoc = [];

    for (const line of doc) {
      if (line.slice(-1) == ';') {
        newDoc.push('\t' + line);
      } else {
        newDoc.push(line);
      }
    }
    resolve(newDoc);
  });
}
