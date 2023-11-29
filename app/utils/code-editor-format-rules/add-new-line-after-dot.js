export async function getDocWithNewLineAfterDots(doc) {
  return new Promise((resolve) => {
    const newDoc = [];
    for (let lineIndex = 0; lineIndex < doc.length; lineIndex++) {
      const currentLineText = doc[lineIndex];
      let nextLineText = null;
      const nextLineIndex = lineIndex + 1;
      if (typeof doc[nextLineIndex] !== 'undefined') {
        nextLineText = doc[nextLineIndex];
      }

      if (nextLineText && nextLineText.startsWith(`@prefix`)) {
        newDoc.push(currentLineText);
        continue;
      }

      if (currentLineText.slice(-1) == '.') {
        newDoc.push(currentLineText + '\n');
      } else {
        newDoc.push(currentLineText);
      }
    }

    resolve(newDoc);
  });
}
