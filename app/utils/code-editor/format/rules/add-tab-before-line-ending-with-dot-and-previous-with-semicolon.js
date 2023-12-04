export async function getDocWithTabBeforeLineEndingOnDotAndPreviousLineEndsWithSemiColon(
  doc
) {
  return new Promise((resolve) => {
    const newDoc = [];
    for (let lineIndex = 0; lineIndex < doc.length; lineIndex++) {
      const currentLineText = doc[lineIndex];
      let previousLineText = null;
      const previousLineIndex = lineIndex - 1;
      if (typeof doc[previousLineIndex] !== 'undefined') {
        previousLineText = doc[previousLineIndex];
      }

      if (currentLineText.slice(-1) == '.') {
        if (previousLineText && previousLineText.slice(-1) == ';') {
          newDoc.push('\t' + currentLineText);
          continue;
        } else {
          newDoc.push(currentLineText);
        }
      } else {
        newDoc.push(currentLineText);
      }
    }

    resolve(newDoc);
  });
}
