import { findValueOnIndex } from '../../../find-value-on-index';

export async function addNewLineAfterLastPredicateOfSubject(
  lines,
  currentLine
) {
  return new Promise((resolve) => {
    const currentLineIndex = lines.indexOf(currentLine);

    if (currentLineIndex !== lines.length - 1) {
      resolve(currentLine);
    }

    const nextLine = findValueOnIndex(lines, currentLineIndex + 1);

    if (!nextLine && !currentLine.startsWith('@prefix')) {
      resolve(`\t` + currentLine + `\n`);
    }

    resolve(currentLine);
  });
}
