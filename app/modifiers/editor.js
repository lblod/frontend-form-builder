import { EditorView, basicSetup } from 'codemirror';
import { turtle } from 'codemirror-lang-turtle';
import { lintGutter } from '@codemirror/lint';
import { indentWithTab } from '@codemirror/commands';
import { keymap } from '@codemirror/view';
import { autocompletion, completionKeymap } from '@codemirror/autocomplete';
import { modifier } from 'ember-modifier';

import { getFormattedEditorCode } from '../utils/code-editor/format/format-editor-doc';
import { completeWord } from '../utils/code-editor/completion/complete-word';
import { simpleLinter } from '../utils/code-editor/format/simple-linter';

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
