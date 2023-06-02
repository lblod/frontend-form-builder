import { EditorView, basicSetup } from 'codemirror';
import { turtle } from 'codemirror-lang-turtle';

import { modifier } from 'ember-modifier';

export default modifier(function editor(parent, [value, onChange]) {
  const extensions = [basicSetup, turtle()];
  const doc = value || '';

  if (typeof onChange === 'function') {
    const updateListener = EditorView.updateListener.of((viewUpdate) => {
      if (viewUpdate.docChanged && typeof onChange === 'function') {
        const doc = viewUpdate.state.doc;
        const value = doc.toString();
        onChange(value, viewUpdate);
      }
    });

    extensions.push(updateListener);
  }

  const editor = new EditorView({
    parent,
    doc,
    extensions,
  });
});
