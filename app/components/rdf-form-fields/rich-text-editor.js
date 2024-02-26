import SimpleInputFieldComponent from '@lblod/ember-submission-form-fields/components/rdf-input-fields/simple-value-input-field';

import { action } from '@ember/object';
import { guidFor } from '@ember/object/internals';
import { tracked } from '@glimmer/tracking';
import { ProseParser, Schema, Selection } from '@lblod/ember-rdfa-editor';
import {
  block_rdfa,
  doc,
  hard_break,
  horizontal_rule,
  invisible_rdfa,
  paragraph,
  repaired_block,
  text,
} from '@lblod/ember-rdfa-editor/nodes';
import { inline_rdfa } from '@lblod/ember-rdfa-editor/marks';
import {
  em,
  strikethrough,
  strong,
  subscript,
  superscript,
  underline,
} from '@lblod/ember-rdfa-editor/plugins/text-style';
import {
  tableKeymap,
  tableNodes,
  tablePlugin,
} from '@lblod/ember-rdfa-editor/plugins/table';
import { image } from '@lblod/ember-rdfa-editor/plugins/image';
import { link, linkView } from '@lblod/ember-rdfa-editor/plugins/link';
import { blockquote } from '@lblod/ember-rdfa-editor/plugins/blockquote';
import { heading } from '@lblod/ember-rdfa-editor/plugins/heading';
import { code_block } from '@lblod/ember-rdfa-editor/plugins/code';
import {
  bullet_list,
  list_item,
  ordered_list,
} from '@lblod/ember-rdfa-editor/plugins/list';
import {
  bullet_list_input_rule,
  ordered_list_input_rule,
} from '@lblod/ember-rdfa-editor/plugins/list/input_rules';
import { placeholder } from '@lblod/ember-rdfa-editor/plugins/placeholder';
import { highlight } from '@lblod/ember-rdfa-editor/plugins/highlight/marks/highlight';
import { color } from '@lblod/ember-rdfa-editor/plugins/color/marks/color';
import { inputRules } from '@lblod/ember-rdfa-editor';

export default class RichTextEditorComponent extends SimpleInputFieldComponent {
  @tracked editorController;
  inputId = 'richtext-' + guidFor(this);

  defaults = {
    highlightColor: '#FFEA00', // Yellow
    textColor: '#000000', // Black
  };

  nodeViews = (controller) => {
    return {
      link: linkView(this.linkOptions)(controller),
    };
  };

  schema = new Schema({
    nodes: {
      doc,
      paragraph,

      repaired_block,

      list_item,
      ordered_list,
      bullet_list,
      placeholder,
      ...tableNodes({ tableGroup: 'block', cellContent: 'block+' }),
      heading,
      blockquote,

      horizontal_rule,
      code_block,

      text,

      image,

      hard_break,
      invisible_rdfa,
      block_rdfa,
      link: link(this.linkOptions),
    },
    marks: {
      inline_rdfa,
      em,
      strong,
      underline,
      strikethrough,
      subscript,
      superscript,
      highlight,
      color,
    },
  });

  plugins = [
    tablePlugin,
    tableKeymap,
    inputRules({
      rules: [
        bullet_list_input_rule(this.schema.nodes.bullet_list),
        ordered_list_input_rule(this.schema.nodes.ordered_list),
      ],
    }),
  ];

  get linkOptions() {
    return {
      interactive: true,
    };
  }

  @action
  handleRdfaEditorInit(editorController) {
    this.editorController = editorController;
    this.setInitialValue();
  }

  @action
  updateValue(e) {
    if (e && typeof e.preventDefault === 'function') e.preventDefault();

    if (this.editorController) {
      this.hasBeenFocused = true;
      const htmlContent = this.editorController.htmlContent;
      const hasTextContent = Boolean(
        this.editorController.mainEditorState.doc.textContent
      );
      const editorValue = hasTextContent ? stripNbspEntities(htmlContent) : '';

      if (this.value !== editorValue) {
        super.updateValue(editorValue);
      }
    }
  }

  setInitialValue() {
    if (this.value) {
      const { editorController } = this;
      const tr = editorController.mainEditorState.tr;
      const domParser = new DOMParser();
      tr.replaceWith(
        0,
        tr.doc.nodeSize - 2,
        ProseParser.fromSchema(this.schema).parse(
          domParser.parseFromString(this.value, 'text/html'),
          {
            preserveWhitespace: true,
          }
        )
      );
      tr.setSelection(Selection.atEnd(tr.doc));
      editorController.editor.mainView.dispatch(tr);
    }
  }
}

// https://discuss.prosemirror.net/t/non-breaking-spaces-being-added-to-pasted-html/3911/4
// Kaleidos ran into the same issue:
// https://github.com/kanselarij-vlaanderen/frontend-kaleidos/blob/6489a2dec8d58f2cc981f0c45267821169061cc7/app/components/news-item/edit-panel.js#L84-L100
function stripNbspEntities(htmlContent) {
  return htmlContent.replaceAll(/&nbsp;/gm, ' ');
}
