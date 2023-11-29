import { getDocWithNewLineAfterDots } from './code-editor-format-rules/add-new-line-after-dot';
import { getDocWithTabBeforeLineEndingOnDotAndPreviousLineEndsWithSemiColon } from './code-editor-format-rules/add-tab-before-line-ending-with-dot-and-previous-with-semicolon';
import { getDocWithTabBeforeLineWithSemicolon } from './code-editor-format-rules/add-tab-before-line-with-semicolon';
import { getDocWithAllSpacesRemovedFromEachLine } from './code-editor-format-rules/remove-all-spaces-from-each-line';

export async function getFormattedEditorCode(doc) {
  doc = await getDocWithAllSpacesRemovedFromEachLine(doc);
  doc =
    await getDocWithTabBeforeLineEndingOnDotAndPreviousLineEndsWithSemiColon(
      doc
    );
  doc = await getDocWithNewLineAfterDots(doc);

  return await getDocWithTabBeforeLineWithSemicolon(doc);
}
