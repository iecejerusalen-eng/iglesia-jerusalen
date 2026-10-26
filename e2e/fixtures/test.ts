import { expect, test as base } from '@playwright/test';
import { defaultLearningDocuments } from '../../src/features/about/defaultLearningDocuments';

const sampleSong = {
  id: 'e2e-song-digno',
  title: 'Digno (Worthy)',
  artist: 'Iglesia Jerusalén',
  bpm: 72,
  type_id: null,
  style_id: null,
  has_chords: true,
  drum_style: 'Balada Worship',
  slug: 'digno-worthy',
  original_key: 'G',
  preferred_accidentals: 'sharp',
  capo: 0,
  time_signature: '4/4',
  status: 'published',
  published_at: '2026-10-01T00:00:00Z',
  created_at: '2026-10-01T00:00:00Z',
  updated_at: '2026-10-01T00:00:00Z',
  lyrics: 'Digno es el Cordero de Dios.',
  resource_links: [],
  structure_blocks: [],
  composers: [],
  song_types: null,
  song_styles: null,
};

/**
 * Every browser test uses an unreachable, synthetic Supabase project. Individual
 * specs may register narrower routes; those handlers run before this fallback.
 */
export const test = base.extend({
  context: async ({ context }, use) => {
    // Context routes are the final fallback; a spec's page.route() takes
    // precedence for its isolated backend fixture.
    await context.route('https://bolls.life/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(Array.from({ length: 200 }, (_, index) => ({
          verse: index + 1,
          text: 'Texto de prueba del versículo.',
        }))),
      });
    });

    await context.route('https://e2e-placeholder.supabase.co/**', async (route) => {
      const { pathname } = new URL(route.request().url());
      if (pathname.startsWith('/auth/v1/')) {
        await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
        return;
      }

      const requestUrl = new URL(route.request().url());
      if (pathname.endsWith('/rest/v1/about_learning_published')) {
        const slug = requestUrl.searchParams.get('slug')?.replace(/^eq\./, '');
        const document = defaultLearningDocuments.find((item) => item.slug === slug);
        if (document) {
          await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({
            ...document,
            revision: 1,
            published_at: '2026-10-01T00:00:00Z',
            reviewed_at: '2026-10-01T00:00:00Z',
            reviewer_label: 'Equipo editorial',
          }) });
          return;
        }
      }

      if (pathname.endsWith('/rest/v1/songs')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(requestUrl.searchParams.has('id') ? sampleSong : [sampleSong]),
        });
        return;
      }

      await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
    });

    // Playwright names the fixture lifecycle function `use`; it is not a hook.
    // eslint-disable-next-line react-hooks/rules-of-hooks
    await use(context);
  },
});

export { expect };
