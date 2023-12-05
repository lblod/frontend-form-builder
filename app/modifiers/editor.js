import { EditorView, basicSetup } from 'codemirror';
import { turtle } from 'codemirror-lang-turtle';
import { lintGutter } from '@codemirror/lint';
import { indentWithTab } from '@codemirror/commands';
import { keymap } from '@codemirror/view';
import { modifier } from 'ember-modifier';
import {
  autocompletion,
  acceptCompletion,
  closeCompletion,
  startCompletion,
} from '@codemirror/autocomplete';

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
      keymap.of([
        indentWithTab,
        {
          key: 'Alt-i',
          run: async function (context) {
            const newDoc = await getFormattedEditorCode(context.state.doc);
            context.docView.view.dispatch({
              changes: {
                from: 0,
                to: context.state.doc.length,
                insert: newDoc.join('\n'),
              },
            });
          },
        },
        { key: 'Ctrl-Space', run: startCompletion },
        { key: 'Escape', run: closeCompletion },
        { key: 'Enter', run: acceptCompletion },
      ]),
      autocompletion({
        activateOnTyping: true,
        override: [completeWord],
      }),
    ];
    const doc = code || '';

    const updateListener = EditorView.updateListener.of(async (viewUpdate) => {
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
