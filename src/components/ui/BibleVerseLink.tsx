import React from 'react';
import { Link } from 'react-router-dom';
import { parseBibleReferences } from '../../utils/bibleParser';

interface BibleVerseLinkProps {
  reference: string;
  className?: string;
}

export function BibleVerseLink({ reference, className = '' }: BibleVerseLinkProps) {
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
            <BibleVerseItem parsedRef={ref} className={className} />
            {idx < parsedRefs.length - 1 && <span>;</span>}
          </React.Fragment>
        );
      })}
    </span>
  );
}

interface BibleVerseItemProps {
  parsedRef: any;
  className?: string;
}

function BibleVerseItem({ parsedRef, className = '' }: BibleVerseItemProps) {
  const { bookId, chapter, verses, original } = parsedRef;
  const versiculoParam = verses ? `&versiculo=${verses.replace(/\s+/g, '')}` : '';
  const toUrl = `/recursos/biblia?libro=${bookId}&capitulo=${chapter}${versiculoParam}`;

  return (
    <Link 
      to={toUrl} 
      target="_blank"
      rel="noopener noreferrer"
      className={`hover:text-amber-600 dark:hover:text-gold underline decoration-amber-500/30 hover:decoration-amber-500 underline-offset-4 transition-colors ${className}`}
    >
      {original}
    </Link>
  );
}

export default BibleVerseLink;
