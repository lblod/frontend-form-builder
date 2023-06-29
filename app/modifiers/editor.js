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

export default modifier(function editor(parent, [value, refresh]) {
  const extensions = [basicSetup, turtle(), simpleLinter(), lintGutter()];
  const doc = value || '';

  const updateListener = EditorView.updateListener.of((viewUpdate) => {
    if (viewUpdate.docChanged) {
      const doc = viewUpdate.state.doc;
      const value = doc.toString();
      refresh.perform(value);
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
}, { eager: false });
