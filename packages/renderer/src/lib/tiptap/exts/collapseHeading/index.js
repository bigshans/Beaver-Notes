import Heading from '@tiptap/extension-heading';
import { VueNodeViewRenderer } from '@tiptap/vue-3';
import CollapseHeading from './CollapseHeading.vue';
import { mergeAttributes } from '@tiptap/core';

export default Heading.extend({
  addOptions() {
    return {
      levels: [1, 2, 3, 4, 5, 6],
      HTMLAttributes: {
        open: true,
        collapsedContent: '',
      },
    };
  },
  parseHTML() {
    return this.options.levels.map((level) => ({
      tag: `h${level}`,
      attrs: { ...this.options.HTMLAttributes, level },
    }));
  },

  renderHTML({ node, HTMLAttributes }) {
    const hasLevel = this.options.levels.includes(node.attrs.level);
    const level = hasLevel ? node.attrs.level : this.options.levels[0];
    Object.assign(HTMLAttributes, node.attrs);
    // record the initial attributes
    Object.assign(this.options.HTMLAttributes, HTMLAttributes);

    return [
      `h${level}`,
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes),
      0,
    ];
  },
  addAttributes() {
    const options = this.parent?.() ?? {};
    return {
      ...options,
      open: {
        default: true,
        rendered: false,
      },
      collapsedContent: {
        default: '',
        rendered: false,
      },
    };
  },
  addCommands() {
    const oldCommands = this.parent?.() ?? {};
    function _findPos(editor, node) {
      const allNodePos = editor.$nodes(node.type.name);
      // don't use eq, beacause it will be matched wrong node.
      return allNodePos.find((p) => p.node === node);
    }
    return {
      ...oldCommands,
      collapseHeading:
        () =>
        ({ editor, commands }) => {
          const findPos = (node) => _findPos(editor, node);
          // all nodes
          const nodes = editor.view.state.doc.content.content;
          const selection = editor.state.selection;
          // current node
          const node = selection.$from.parent;
          if (!node.attrs.open) {
            return false;
          }
          const level = node.attrs.level;
          const rs = selection.from + node.nodeSize - 1;
          const start = nodes.findIndex((n) => n === node);
          if (start < 0) {
            return false;
          }
          let end = nodes.length;
          const lastNode = nodes[nodes.length - 1];
          const lastPos = findPos(lastNode);
          let re = lastPos.from + lastNode.content.size;
          for (let i = start + 1, len = nodes.length; i < len; i++) {
            const n = nodes[i];
            if (n.type.name === 'heading' && n.attrs.level <= level) {
              end = i;
              const t = findPos(n);
              re = t.from - 1;
              break;
            }
          }
          const collapsedContent = JSON.stringify(nodes.slice(start + 1, end));
          const attrs = {
            ...(node.attrs ?? {}),
            collapsedContent,
            open: false,
          };
          commands.setNode(this.name, attrs);
          return (
            collapsedContent !== '[]' &&
            commands.deleteRange({ from: rs, to: re })
          );
        },
      unCollapsedHeading:
        () =>
        ({ editor, commands }) => {
          const findPos = (node) => _findPos(editor, node);
          const nodes = editor.view.state.doc.content.content;
          const selection = editor.state.selection;
          // current node
          const node = selection.$from.parent;
          const collapsedContent = node.attrs.collapsedContent;
          if (
            node.attrs.open ||
            collapsedContent == null ||
            collapsedContent === ''
          ) {
            return false;
          }
          const start = nodes.findIndex((n) => n === node);
          if (start < 0) {
            return false;
          }
          const nodePos = findPos(nodes[start]);
          try {
            const cNodes = JSON.parse(collapsedContent);
            const attrs = {
              ...(node.attrs ?? {}),
              collapsedContent: '',
              open: true,
            };
            commands.setNode(this.name, attrs);
            if (cNodes.length === 0) {
              return false;
            }
            if (nodePos.node.content.size === 0) {
              return commands.insertContentAt(nodePos.range, cNodes);
            } else {
              return commands.insertContentAt(
                nodePos.from + nodePos.node.content.size,
                cNodes
              );
            }
          } catch (e) {
            console.error(e);
          }
          return false;
        },
      toggleCollapse:
        () =>
        ({ editor, commands }) => {
          const selection = editor.state.selection;
          // current node
          const node = selection.$from.parent;
          return node.attrs.open
            ? commands.collapseHeading()
            : commands.unCollapsedHeading();
        },
    };
  },
  addNodeView() {
    // reference: https://github.com/ueberdosis/tiptap/issues/3186
    return VueNodeViewRenderer(CollapseHeading, {
      update: ({ oldNode, newNode, updateProps }) => {
        if (newNode.type.name !== this.name) return false;
        // Make sure to redraw node as the vue renderer will not show the updated children
        if (Object.keys(oldNode.attrs).length === 0) {
          // When `oldNode.attrs` is `{}`, we need to solve it in a special way.
          // collapse
          if (this.options.HTMLAttributes.level === newNode.attrs.level) {
            updateProps();
            return true;
          }
          // toggleHeading
          return false;
        }
        if (newNode.attrs.level !== oldNode.attrs.level) {
          const newLevel = newNode.attrs.level;
          newNode.attrs = { ...oldNode.attrs, level: newLevel };
          return false;
        }
        updateProps();
        return true;
      },
    });
  },
});
