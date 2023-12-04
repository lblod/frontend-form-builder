import { EditorView, basicSetup } from 'codemirror';
import { turtle } from 'codemirror-lang-turtle';
import { syntaxTree } from '@codemirror/language';
import { linter, lintGutter } from '@codemirror/lint';
import { indentWithTab } from '@codemirror/commands';
import { keymap } from '@codemirror/view';
import { autocompletion, completionKeymap } from '@codemirror/autocomplete';

import { modifier } from 'ember-modifier';
import { getFormattedEditorCode } from '../utils/code-editor/format/format-editor-doc';
import { completeWord } from '../utils/code-editor/completion/complete-word';

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
    const extensions = [
      basicSetup,
      turtle(),
      simpleLinter(),
      lintGutter(),
      keymap.of([indentWithTab, completionKeymap]),
      autocompletion({
        activateOnTyping: true,
        override: [completeWord],
      }),
    ];
    const doc = code || '';

    const updateListener = EditorView.updateListener.of(async (viewUpdate) => {
      if (viewUpdate.focusChanged) {
        const newDoc = await getFormattedEditorCode(viewUpdate.state.doc);

        viewUpdate.view.dispatch({
          changes: {
            from: 0,
            to: viewUpdate.state.doc.length,
            insert: newDoc.join('\n'),
          },
        });
      }

      if (viewUpdate.docChanged) {
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
