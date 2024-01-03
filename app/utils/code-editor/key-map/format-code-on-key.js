import { getFormattedEditorCode } from '../format/format-editor-doc';

export default {
  key: 'Shift-Alt-f',
  linux: 'Ctrl-Shift-i',
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
};
