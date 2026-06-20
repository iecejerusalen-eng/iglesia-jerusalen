import { Node, mergeAttributes, nodeInputRule } from '@tiptap/core';

export interface ChordOptions {
  HTMLAttributes: Record<string, any>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    chord: {
      /**
       * Insert a chord node
       */
      setChord: (attributes: { chord: string }) => ReturnType;
    };
  }
}

export const ChordExtension = Node.create<ChordOptions>({
  name: 'chord',

  group: 'inline',
  inline: true,
  selectable: true,
  atom: true,

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  addAttributes() {
    return {
      chord: {
        default: null,
        parseHTML: (element: HTMLElement) => {
          return element.getAttribute('data-chord');
        },
        renderHTML: (attributes: Record<string, any>) => {
          if (!attributes.chord) return {};
          return { 'data-chord': attributes.chord };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-chord-node]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'span',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, { 
        class: 'chord-node',
        'data-chord-node': 'true' 
      }),
    ];
  },

  addCommands() {
    return {
      setChord:
        (attributes) =>
        ({ chain }) => {
          return chain()
            .insertContent({ type: this.name, attrs: attributes })
            .run();
        },
    };
  },

  addInputRules() {
    return [
      nodeInputRule({
        find: /\[([a-zA-Z0-9#]+)\]$/,
        type: this.type,
        getAttributes: (match) => {
          return {
            chord: match[1],
          };
        },
      }),
    ];
  },
});

export default ChordExtension;
