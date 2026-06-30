import { Mark, mergeAttributes } from '@tiptap/core';

export interface BibleVerseOptions {
  HTMLAttributes: Record<string, any>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    bibleVerse: {
      /**
       * Set a bible verse mark
       */
      setBibleVerse: (attributes: { reference: string }) => ReturnType;
      /**
       * Toggle a bible verse mark
       */
      toggleBibleVerse: (attributes: { reference: string }) => ReturnType;
      /**
       * Unset a bible verse mark
       */
      unsetBibleVerse: () => ReturnType;
    }
  }
}

export const BibleVerseExtension = Mark.create<BibleVerseOptions>({
  name: 'bibleVerse',

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-type="bible-verse"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, { 'data-type': 'bible-verse', class: 'bible-verse-mark font-bold text-amber-600 dark:text-amber-500 cursor-pointer' }), 0];
  },

  addAttributes() {
    return {
      reference: {
        default: null,
        parseHTML: element => element.getAttribute('data-reference'),
        renderHTML: attributes => {
          if (!attributes.reference) {
            return {};
          }
          return {
            'data-reference': attributes.reference,
          };
        },
      },
    };
  },

  addCommands() {
    return {
      setBibleVerse:
        (attributes) =>
        ({ commands }) => {
          return commands.setMark(this.name, attributes);
        },
      toggleBibleVerse:
        (attributes) =>
        ({ commands }) => {
          return commands.toggleMark(this.name, attributes);
        },
      unsetBibleVerse:
        () =>
        ({ commands }) => {
          return commands.unsetMark(this.name);
        },
    };
  },
});
