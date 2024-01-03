import { getDocWithNewLineAfterDots } from './rules/add-new-line-after-dot';
import { getDocWithTabBeforeLineEndingOnDotAndPreviousLineEndsWithSemiColon } from './rules/add-tab-before-line-ending-with-dot-and-previous-with-semicolon';
import { getDocWithTabBeforeLineWithSemicolon } from './rules/add-tab-before-line-with-semicolon';
import { getDocWhereAllIncludesAreTabbed } from './rules/add-tab-before-item-that-is-included';
import { getDocWithFormattedValidations } from './rules/format-blankNode-validations';
import { getDocWithParsedLinesThatEndOnDotAndIncludeSemicolons } from './rules/parse-line-when-ending-on-dot-and-semicolon-included';
import { getDocWithAllSpacesRemovedFromEachLine } from './rules/remove-all-spaces-from-each-line';

export async function getFormattedEditorCode(doc) {
  // Watch out with the order
  doc = await getDocWithAllSpacesRemovedFromEachLine(doc);
  doc = await getDocWhereAllIncludesAreTabbed(doc);
  doc =
    await getDocWithTabBeforeLineEndingOnDotAndPreviousLineEndsWithSemiColon(
      doc
    );
  doc = await getDocWithNewLineAfterDots(doc);
  doc = await getDocWithTabBeforeLineWithSemicolon(doc);
  doc = await getDocWithFormattedValidations(doc);
  doc = await getDocWithParsedLinesThatEndOnDotAndIncludeSemicolons(doc);

  return await getDocWithNewLineAfterDots(doc); // this rule is done twice because all the rules before could have changed this "a nice finisher"
}
