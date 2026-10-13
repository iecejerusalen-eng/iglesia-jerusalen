import { describe, expect, it } from 'vitest';
import { defaultLearningDocuments } from './defaultLearningDocuments';
import { validateLearningDocument, youtubeId } from './learningDocument';

describe('Learning documents', () => {
  it('validates all five sourced documents and questions', () => {
    expect(defaultLearningDocuments).toHaveLength(5);
    for (const document of defaultLearningDocuments) expect(validateLearningDocument(document).slug).toBe(document.slug);
  });
  it('keeps school/UTPL material out of the church history', () => {
    const history = defaultLearningDocuments.find(d => d.slug === 'historia')!;
    expect(history.content.chapters.some(c => c.id === 'servicio-educativo')).toBe(false);
    expect(JSON.stringify(history)).not.toMatch(/UTPL|dspace\.utpl|Ávila Burbano|Unidad Educativa/);
  });
  it('rejects duplicated chapter destinations', () => {
    const document = structuredClone(defaultLearningDocuments[0]); document.content.chapters.push(document.content.chapters[0]);
    expect(() => validateLearningDocument(document)).toThrow(/únicos/);
  });
  it('rejects missing sources and impossible quiz answers', () => {
    const document = structuredClone(defaultLearningDocuments[0]); document.sources = [];
    expect(() => validateLearningDocument(document)).toThrow();
    document.sources = defaultLearningDocuments[0].sources; document.content.quiz[0].correct = 99;
    expect(() => validateLearningDocument(document)).toThrow();
  });
  it('rejects executable and protocol-relative source URLs', () => {
    for (const href of ['javascript:alert(1)', '//another-site.test/image']) {
      const document = structuredClone(defaultLearningDocuments[0]); document.sources[0].href = href;
      expect(() => validateLearningDocument(document)).toThrow();
    }
  });
  it('accepts published media without exposing its private authorization note', () => {
    const document = structuredClone(defaultLearningDocuments.find(d => d.slug === 'himno')!); delete document.content.audio!.authorization;
    expect(validateLearningDocument(document).content.audio?.credit).toContain('ICC SUR Ibagué');
  });
  it('only extracts video IDs from actual YouTube hosts', () => {
    expect(youtubeId('https://www.youtube.com/watch?v=-I1Omj7vE6k')).toBe('-I1Omj7vE6k');
    expect(youtubeId('https://youtu.be/-I1Omj7vE6k')).toBe('-I1Omj7vE6k');
    expect(youtubeId('https://youtube.com.evil.test/watch?v=-I1Omj7vE6k')).toBeNull();
  });
});
