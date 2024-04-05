import { syntaxTree } from '@codemirror/language';
import { linter } from '@codemirror/lint';

export function simpleLinter() {
  return linter((view) => {
    const { state } = view;
    const tree = syntaxTree(state);
    if (tree.length === state.doc.length) {
      const errorPositions = [];
      tree.iterate({
        enter: (n) => {
          if (n.type.isError) {
            errorPositions.push(n.from);
          }
        },
      });

      if (errorPositions.length > 0) {
        return errorPositions.map(pos => ({
          from: pos,
          to: pos + 1,
          severity: 'error',
          message: 'syntax error',
        }));
      } else {
        return [];
      }
    }

    return [];
  });
}
