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

import { completeWord } from '../utils/code-editor/completion/complete-word';
import { simpleLinter } from '../utils/code-editor/format/simple-linter';
import formatCodeOnKey from '../utils/code-editor/key-map/format-code-on-key';

export default modifier(
  function editor(parent, [code, onCodeChangeHandler]) {
    const extensions = [
      basicSetup,
      turtle(),
      simpleLinter(),
      lintGutter(),
      keymap.of([
        indentWithTab,
        formatCodeOnKey,
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
