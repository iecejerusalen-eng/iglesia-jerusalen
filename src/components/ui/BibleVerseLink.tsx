import React from 'react';
import { Link } from 'react-router-dom';
import { parseBibleReferences, type ParsedVerse } from '../../utils/bibleParser';
import BibleVersePreview from './BibleVersePreview';

interface BibleVerseLinkProps {
  reference: string;
  className?: string;
  preview?: boolean;
}

export function BibleVerseLink({ reference, className = '', preview = true }: BibleVerseLinkProps) {
  const parsedRefs = parseBibleReferences(reference);

  // If we couldn't parse any valid reference, fallback to simple text
  if (parsedRefs.length === 0 || !parsedRefs.some(r => r.bookId)) {
    return <span className={className}>{reference}</span>;
  }

  return (
    <span className="inline-flex gap-1 flex-wrap">
      {parsedRefs.map((ref, idx) => {
        if (!ref.bookId) {
          return <span key={idx} className={className}>{ref.original}</span>;
        }

        return (
          <React.Fragment key={idx}>
            <BibleVerseItem parsedRef={ref} className={className} preview={preview} />
            {idx < parsedRefs.length - 1 && <span>;</span>}
          </React.Fragment>
        );
      })}
    </span>
  );
}

interface BibleVerseItemProps {
  parsedRef: ParsedVerse;
  className?: string;
  preview?: boolean;
}

function BibleVerseItem({ parsedRef, className = '', preview = false }: BibleVerseItemProps) {
  const { bookId, chapter, verses, original } = parsedRef;
  if (preview) return <BibleVersePreview reference={original} appearance="link" className={className} />;
  const versiculoParam = verses ? `&versiculo=${verses.replace(/\s+/g, '')}` : '';
  const toUrl = `/recursos/biblia?libro=${bookId}&capitulo=${chapter}${versiculoParam}`;

  return (
    <Link 
      to={toUrl} 
      target="_blank"
      rel="noopener noreferrer"
      className={`rounded-sm transition-colors hover:text-church-gold-emphasis focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 dark:hover:text-church-gold-light ${className}`}
    >
      {original}
    </Link>
  );
}

export default BibleVerseLink;
