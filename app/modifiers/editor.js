import { EditorView, basicSetup } from 'codemirror';
import { turtle } from 'codemirror-lang-turtle';
import { syntaxTree } from '@codemirror/language';
import { linter, lintGutter } from '@codemirror/lint';

import { modifier } from 'ember-modifier';

function simpleLinter() {
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

export default modifier(
  function editor(parent, [code, onCodeChangeHandler]) {
    const extensions = [basicSetup, turtle(), simpleLinter(), lintGutter()];
    const doc = code || '';

    const updateListener = EditorView.updateListener.of((viewUpdate) => {
      // todo: viewUpdate.docChanged SFB-71 - to prevent lagging of tthe typeing in the editor
      if (viewUpdate.focusChanged) {
        const doc = viewUpdate.state.doc;
        const newCode = doc.toString();
        onCodeChangeHandler(newCode);
      }
    });

    extensions.push(updateListener);

    const editor = new EditorView({
      parent,
      doc,
      extensions,
    });

    return () => {
      editor.destroy();
    };
  },
  { eager: false }
);
