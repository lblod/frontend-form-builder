export async function getDocWithParsedLinesThatEndOnDotAndIncludeSemicolons(
  doc
) {
  return new Promise((resolve) => {
    const newDoc = [];
    for (const line of doc) {
      if (line.trim().slice(-1) == '.' && line.includes(';')) {
        const itemsToAdd = line.split(';').map((text) => {
          let formattedText = text.trim();
          if (
            formattedText.slice(-1) !== '.' &&
            formattedText.slice(-1) !== ';'
          ) {
            formattedText = formattedText + ';';
          }
          return '\t' + formattedText;
        });
        newDoc.push(...itemsToAdd);
      } else {
        newDoc.push(line);
      }
    }

    resolve(newDoc);
  });
}
