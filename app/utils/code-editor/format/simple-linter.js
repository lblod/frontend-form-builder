import { syntaxTree } from '@codemirror/language';
import { linter } from '@codemirror/lint';

export function simpleLinter() {
  return linter((view) => {
    const { state } = view;
    const tree = syntaxTree(state);
    if (tree.length === state.doc.length) {
      let pos = null;
      tree.iterate({
        enter: (n) => {
          if (pos == null && n.type.isError) {
            pos = n.from;
            return false;
          }
        },
      });

      if (pos != null)
        return [
          {
            from: pos,
            to: pos + 1,
            severity: 'error',
            message: 'syntax error',
          },
        ];
    }

    return [];
  });
}
