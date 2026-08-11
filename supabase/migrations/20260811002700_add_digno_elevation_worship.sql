-- Insert Digno (Worthy) by Elevation Worship (Key: Eb) into public.songs

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
  'b2c3d4e5-f6a7-48b9-c012-3456789abcde',
  'Digno (Worthy)',
  'Elevation Worship',
  'digno-worthy',
  'Eb',
  'flat',
  0,
  68,
  '4/4',
  'published',
  true,
  'Worship 4/4 (Balada Rítmica)',
  '[
    {"id":"ref-yt-digno-1","title":"Digno (Worthy) [En vivo] - Elevation Worship","url":"https://www.youtube.com/watch?v=rx_alw9-jTs","kind":"video","category":"video_clip","instrument":"General","visibility":"public"},
    {"id":"ref-yt-digno-2","title":"Digno (Worthy) - Video de Letras","url":"https://www.youtube.com/watch?v=VTnZ-xNemeI","kind":"video","category":"lyrics_video","instrument":"General","visibility":"public"},
    {"id":"ref-yt-digno-3","title":"Tutorial Guitarra - Digno","url":"https://www.youtube.com/watch?v=LPUtaxeEO7E","kind":"video","category":"lesson","instrument":"Guitarra","visibility":"public"},
    {"id":"ref-yt-digno-4","title":"Multitrack / Secuencia - Digno","url":"https://www.youtube.com/watch?v=v-BX9nEAWOY","kind":"video","category":"backing_track","instrument":"General","visibility":"public"},
    {"id":"ref-yt-digno-5","title":"Tutorial Batería - Digno","url":"https://www.youtube.com/watch?v=9WtAp-G981Y","kind":"video","category":"lesson","instrument":"Batería","visibility":"public"},
    {"id":"ref-cifra-digno","title":"CifraClub - Digno (Acordes)","url":"https://www.cifraclub.com/elevation-worship/digno/","kind":"link","category":"sheet_music","instrument":"General","visibility":"public"},
    {"id":"ref-songsterr-digno","title":"Songsterr - Drum Tab Digno (Worthy)","url":"https://www.songsterr.com/a/wsa/elevation-worship-worthy-live-elevation-worship-drum-tab-s2537171","kind":"link","category":"sheet_music","instrument":"Batería","visibility":"public"}
  ]'::jsonb,
  '[
    {
      "id": "blk-digno-intro",
      "type": "lyrics",
      "section_type": "intro",
      "label": "Intro",
      "lyrics": "[Cm7] [Eb] [Ab] [Bb] [Cm7] [Eb] [Ab] [Bb]"
    },
    {
      "id": "blk-digno-verse-1",
      "type": "lyrics",
      "section_type": "estrofa",
      "label": "Estrofa 1",
      "lyrics": "[Eb]Cargaste Tú mi [Bb4]cruz [Bb]\nMi liber[Gm]tad con Tu [Ab]vida compra[Eb]ste [Bb]\n[Eb]Y ahora Tuyo [Bb4]soy [Bb]\nProcla[Eb]maré Tu bon[Ab]dad para siem[Eb]pre [Bb]"
    },
    {
      "id": "blk-digno-chorus-1",
      "type": "lyrics",
      "section_type": "coro",
      "label": "Coro 1",
      "lyrics": "Digno de ala[Ab]bar, Cris[Bb]to\nNombre sin i[Gm]gual, Digno de ala[Bb/D]bar [Cm]\nDigno de ala[Ab]bar, Cris[Bb]to\nNombre sin i[Gm]gual, Digno de ala[Cm]bar"
    },
    {
      "id": "blk-digno-solo-1",
      "type": "lyrics",
      "section_type": "solo",
      "label": "Solo 1",
      "lyrics": "[Cm] [Eb] [Ab] [Bb] [Cm] [Eb] [Ab] [Bb]"
    },
    {
      "id": "blk-digno-tab-1",
      "type": "tablature",
      "title": "Solo 1 Guitarra",
      "instrument": "guitar",
      "tuning": "Estándar (E A D G B E)",
      "content": "  Eb        Ab    Bb    Cm     \nE|----6-----8--6--------------------------------------|\nB|-------8--------6-----------------------------------|\nG|-------------------8-/12----------------------------|\nD|----------------------------------------------------|\nA|----------------------------------------------------|\nE|----------------------------------------------------|\n\n  Eb        Ab    Bb    Eb  \nE|----6-----8--6--------------------------------------|\nB|-------8--------6-----------------------------------|\nG|-------------------8-/12----------------------------|\nD|----------------------------------------------------|\nA|----------------------------------------------------|\nE|----------------------------------------------------|"
    },
    {
      "id": "blk-digno-verse-2",
      "type": "lyrics",
      "section_type": "estrofa",
      "label": "Estrofa 2",
      "lyrics": "[Eb]Vergüenza huye [Bb4]hoy [Bb]\nRen[Gm]dido estoy ante tu [Ab]amor innega[Eb]ble [Bb]\n[Eb]Tu gracia eterna [Bb4]es [Bb]\nProcla[Gm]maré Tu bon[Ab]dad para siem[Eb]pre [Bb]"
    },
    {
      "id": "blk-digno-chorus-2",
      "type": "lyrics",
      "section_type": "coro",
      "label": "Coro 2",
      "lyrics": "Digno de ala[Ab]bar, Cris[Cm]to [Bb]\nNombre sin i[Gm]gual, Digno de ala[Cm]bar [Bb]\nDigno de ala[Ab]bar, Cris[Cm]to [Bb]\nNombre sin i[Gm]gual, Digno de ala[Cm]bar [Bb]"
    },
    {
      "id": "blk-digno-bridge",
      "type": "lyrics",
      "section_type": "puente",
      "label": "Puente",
      "lyrics": "[Eb]Sé exal[Ab]tado hoy en los cielos\nVen y [Fm]llena este lugar\nEres [Cm]digno de alabar\nNo hay [Bb]otro nombre igual"
    },
    {
      "id": "blk-digno-tab-2",
      "type": "tablature",
      "title": "Solo 2 Guitarra",
      "instrument": "guitar",
      "tuning": "Estándar (E A D G B E)",
      "content": "Part 1 of 2\n   Fm          Cm          Eb          Bb          \nE|-8-----6-----8-----------------6-----8--------------|\nB|----------8--------6-----8--------8--------6--------|\nG|----------------------8-----------------------8-----|\nD|----------------------------------------------------|\nA|----------------------------------------------------|\nE|----------------------------------------------------|\n\nPart 2 of 2\n   Fm        Cm          Eb          Bb \nE|-----6-----8-----------------6-----8--6-------------|\nB|--------8--------6-----8--------8--------6----------|\nG|-5------------------8-----------------------8--5----|\nD|----------------------------------------------------|\nA|----------------------------------------------------|\nE|----------------------------------------------------|"
    },
    {
      "id": "blk-digno-outro",
      "type": "lyrics",
      "section_type": "outro",
      "label": "Outro",
      "lyrics": "[Bb] [Ab]"
    },
    {
      "id": "blk-digno-chords-guitar",
      "type": "chord_diagram",
      "instrument": "guitar",
      "chords": ["Ab", "Bb", "Bb/D", "Bb4", "Cm", "Cm7", "Eb", "Fm", "Gm"]
    },
    {
      "id": "blk-digno-chords-piano",
      "type": "chord_diagram",
      "instrument": "piano",
      "chords": ["Ab", "Bb", "Bb/D", "Bb4", "Cm", "Cm7", "Eb", "Fm", "Gm"]
    },
    {
      "id": "blk-digno-chords-ukulele",
      "type": "chord_diagram",
      "instrument": "ukulele",
      "chords": ["Ab", "Bb", "Bb/D", "Bb4", "Cm", "Cm7", "Eb", "Fm", "Gm"]
    },
    {
      "id": "blk-digno-note-guitar",
      "type": "musician_note",
      "target_instrument": "Guitarra",
      "content": "El Solo 1 usa arpegio suave en trastes 6-8. En el Puente y Solo 2 aumentar ganancia / overdrive dinámico."
    },
    {
      "id": "blk-digno-note-drums",
      "type": "musician_note",
      "target_instrument": "Batería",
      "content": "Ritmo Balada Worship 4/4 (68 BPM). Entrada progresiva en Puente con tom de piso y crescendos de platillo en compás 60-65."
    }
  ]'::jsonb,
  '<p class="lyrics-line">[Intro] [Cm7] [Eb] [Ab] [Bb] [Cm7] [Eb] [Ab] [Bb]</p><p class="lyrics-line">[Estrofa 1] [Eb]Cargaste Tú mi [Bb4]cruz [Bb], mi liber[Gm]tad con Tu [Ab]vida compra[Eb]ste [Bb]</p>'
);

NOTIFY pgrst, 'reload schema';
