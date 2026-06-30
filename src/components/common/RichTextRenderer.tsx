import React from 'react';
import parse, { Element, type DOMNode } from 'html-react-parser';
import BibleVerseLink from '../ui/BibleVerseLink';

interface RichTextRendererProps {
  html: string;
  className?: string;
}

const RichTextRenderer: React.FC<RichTextRendererProps> = ({ html, className = '' }) => {
  const options = {
    replace: (domNode: DOMNode) => {
      if (domNode instanceof Element && domNode.attribs) {
        if (domNode.name === 'span' && domNode.attribs['data-type'] === 'bible-verse') {
          const reference = domNode.attribs['data-reference'];
          if (reference) {
            return (
              <BibleVerseLink reference={reference} />
            );
          }
        }
      }
    }
  };

  return (
    <div className={`rich-text-content ${className}`}>
      {parse(html, options)}
    </div>
  );
};

export default RichTextRenderer;
