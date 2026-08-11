-- Clear existing test songs and insert Santo Por Siempre by Adoración La IBI (Key: G)

DELETE FROM public.song_arrangements WHERE song_id IN (SELECT id FROM public.songs);
DELETE FROM public.songs;

INSERT INTO public.songs (
  id,
  title,
  artist,
  slug,
  original_key,
  preferred_accidentals,
  capo,
  bpm,
  time_signature,
  status,
  has_chords,
  drum_style,
  resource_links,
  structure_blocks,
  lyrics
) VALUES (
  'a1b2c3d4-e5f6-47a8-b901-23456789abcd',
  'Santo Por Siempre',
  'Adoración La IBI',
  'santo-por-siempre',
  'G',
  'sharp',
  0,
  70,
  '4/4',
  'published',
  true,
  'Worship 4/4 (Balada Rítmica)',
  '[{"id":"ref-cifra-1","title":"CifraClub - Santo Por Siempre (IBI)","url":"https://www.cifraclub.com/la-ibi/santo-por-siempre/","kind":"video","instrument":"General","visibility":"public"}]'::jsonb,
  '[
    {
      "id": "blk-intro-1",
      "type": "lyrics",
      "section_type": "intro",
      "label": "Intro",
      "lyrics": "[C] [Em] [D] [Bm] [Em] [D] [G]"
    },
    {
      "id": "blk-verse-1",
      "type": "lyrics",
      "section_type": "estrofa",
      "label": "Estrofa 1",
      "lyrics": "Mil generaciones [C]se postran adora[G]rle\nLe cantan al cor[Em]dero que ven[D]ció [C]"
    },
    {
      "id": "blk-verse-2",
      "type": "lyrics",
      "section_type": "estrofa",
      "label": "Estrofa 2",
      "lyrics": "Los que nos precedieron [C]y los que en Él cree[G]rán\nLe cantarán a a[Em]quel que ya ven[D]ció [C]"
    },
    {
      "id": "blk-pre-chorus-1",
      "type": "lyrics",
      "section_type": "puente",
      "label": "Pre-Coro",
      "lyrics": "Tu nombre es más al[Em]to, tu nombre es más gran[D]de\nTu nombre sobre [Em]todo [D]es [C]\nSean tronos, domi[Em]nios, poderes y rei[D]nos\nTu nombre sobre [Em]todo [D]es [Am7]"
    },
    {
      "id": "blk-chorus-1",
      "type": "lyrics",
      "section_type": "coro",
      "label": "Coro 1",
      "lyrics": "Claman ángeles: [C]San[Em]to [D]\nClama la creación: [Bm7]San[Em]to\nExaltado Dios: [Am7]San[D]to\nSanto por siem[G]pre"
    },
    {
      "id": "blk-verse-3",
      "type": "lyrics",
      "section_type": "estrofa",
      "label": "Estrofa 3",
      "lyrics": "Si te ha perdonado [C]y tienes salvaci[G]ón\nCántale al cor[Em]dero que ven[D]ció [C]"
    },
    {
      "id": "blk-verse-4",
      "type": "lyrics",
      "section_type": "estrofa",
      "label": "Estrofa 4",
      "lyrics": "Si te ha libertado, [C]su nombre ha puesto en [G]ti\nCántale al cor[Em]dero que ven[D]ció [C]"
    },
    {
      "id": "blk-pre-chorus-2",
      "type": "lyrics",
      "section_type": "puente",
      "label": "Pre-Coro 2",
      "lyrics": "Cantaremos siempre \"[Em]amén[D]\" [Am]"
    },
    {
      "id": "blk-chorus-2",
      "type": "lyrics",
      "section_type": "coro",
      "label": "Coro 2",
      "lyrics": "Canta el pueblo al Rey: [C]San[Em]to [D]\nSoberano es Él: [Bm7]San[Em]to\nY por siempre es: [Am7]San[D]to\nSanto por siem[G]pre"
    },
    {
      "id": "blk-outro-1",
      "type": "lyrics",
      "section_type": "outro",
      "label": "Outro",
      "lyrics": "Y por siempre es: [Am7]San[D]to\nSanto Por Siem[G]pre [C] [G]"
    },
    {
      "id": "blk-chords-guitar",
      "type": "chord_diagram",
      "instrument": "guitar",
      "chords": ["G", "C", "Em", "D", "Bm", "Bm7", "Am", "Am7"]
    },
    {
      "id": "blk-chords-piano",
      "type": "chord_diagram",
      "instrument": "piano",
      "chords": ["G", "C", "Em", "D", "Bm", "Bm7", "Am", "Am7"]
    },
    {
      "id": "blk-chords-ukulele",
      "type": "chord_diagram",
      "instrument": "ukulele",
      "chords": ["G", "C", "Em", "D", "Bm", "Bm7", "Am", "Am7"]
    },
    {
      "id": "blk-note-piano",
      "type": "musician_note",
      "target_instrument": "Piano",
      "content": "Intensidad progresiva: comienza suave en arpegios de C, Em, D; explota en octavas con pedal en el Coro."
    },
    {
      "id": "blk-note-drums",
      "type": "musician_note",
      "target_instrument": "Batería",
      "content": "Marcación en negras (Worship 4/4) en Estrofas. Entrada de tom de piso en Pre-Coro y bombo completo en Coro."
    }
  ]'::jsonb,
  '<p class="lyrics-line">[Intro] [C] [Em] [D] [Bm] [Em] [D] [G]</p><p class="lyrics-line">[Estrofa 1] Mil generaciones [C]se postran adora[G]rle, le cantan al cor[Em]dero que ven[D]ció [C]</p>'
);

NOTIFY pgrst, 'reload schema';
