import { addTabBeforeLineEndingOnSemiColon } from './rules/add-tab-before-line-ending-with-semicolon';
import { splitDocPerSubject } from './separate-doc-subjects-with-their-predicates';
import { formatPrefixes } from './rules/prefixes';
import { addNewLineAfterLastPredicateOfSubject } from './rules/add-new-line-after-line-ending-with-dot';
import { findValueOnIndex } from '../../find-value-on-index';

export async function getFormattedEditorCode(doc) {
  let newDoc = [];
  const docPerSubject = await splitDocPerSubject(doc);

  for (const subjectLine of docPerSubject) {
    for (const line of subjectLine) {
      let formattedLine = line;
      formattedLine = await addNewLineAfterLastPredicateOfSubject(
        subjectLine,
        line
      );
      formattedLine = await addTabBeforeLineEndingOnSemiColon(formattedLine);

      newDoc.push(formattedLine);
    }
  }

  for (const newDocLine of newDoc) {
    const currentLineIndex = newDoc.indexOf(newDocLine);
    const nextLine = findValueOnIndex(newDoc, currentLineIndex + 1);

    newDoc[currentLineIndex] = await formatPrefixes(newDocLine, nextLine);
  }

  return newDoc;
}
