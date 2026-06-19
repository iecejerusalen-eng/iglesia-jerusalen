import { Mark, mergeAttributes } from '@tiptap/core';

export interface ChordOptions {
  HTMLAttributes: Record<string, any>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    chord: {
      /**
       * Set a chord annotation on the selected text
       */
      setChord: (attributes: { chord: string }) => ReturnType;
      /**
       * Remove a chord annotation from the selected text
       */
      unsetChord: () => ReturnType;
      /**
       * Toggle a chord annotation on the selected text
       */
      toggleChord: (attributes: { chord: string }) => ReturnType;
    };
  }
}

export const ChordExtension = Mark.create<ChordOptions>({
  name: 'chord',

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
          if (!element || typeof element.getAttribute !== 'function') return null;
          const directChord = element.getAttribute('data-chord');
          if (directChord) return directChord;
          if (typeof element.querySelector === 'function') {
            return element.querySelector('rt')?.textContent || null;
          }
          return null;
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
        tag: 'ruby',
      },
      {
        tag: 'span[data-chord]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    // Render as a clean span tag with data-chord attribute
    return [
      'span',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, { class: 'chord-annotation' }),
      0,
    ];
  },

  addCommands() {
    return {
      setChord:
        (attributes) =>
        ({ commands }) => {
          return commands.setMark(this.name, attributes);
        },
      unsetChord:
        () =>
        ({ commands }) => {
          return commands.unsetMark(this.name);
        },
      toggleChord:
        (attributes) =>
        ({ commands }) => {
          return commands.toggleMark(this.name, attributes);
        },
    };
  },
});

export default ChordExtension;
