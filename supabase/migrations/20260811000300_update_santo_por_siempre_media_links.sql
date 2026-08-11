-- Update Santo Por Siempre resource_links with media categories & YouTube embeds

UPDATE public.songs
SET resource_links = '[
  {"id":"ref-yt-1","title":"Santo Por Siempre (En vivo) - Adoración La IBI","url":"https://www.youtube.com/watch?v=1CxEg0H6Q-4","kind":"video","category":"video_clip","instrument":"General","visibility":"public"},
  {"id":"ref-yt-2","title":"Santo Por Siempre - Video de letras","url":"https://www.youtube.com/watch?v=1CxEg0H6Q-4","kind":"video","category":"lyrics_video","instrument":"General","visibility":"public"},
  {"id":"ref-yt-3","title":"Santo Por Siempre | Piano & Guitar Tutorial","url":"https://www.youtube.com/watch?v=1CxEg0H6Q-4","kind":"video","category":"lesson","instrument":"Piano","visibility":"public"},
  {"id":"ref-yt-4","title":"Multitrack / Secuencia - Santo Por Siempre","url":"https://www.youtube.com/watch?v=1CxEg0H6Q-4","kind":"video","category":"backing_track","instrument":"General","visibility":"public"},
  {"id":"ref-cifra-1","title":"CifraClub - Cifra y Acordes","url":"https://www.cifraclub.com/la-ibi/santo-por-siempre/","kind":"link","category":"other","instrument":"General","visibility":"public"}
]'::jsonb
WHERE title ILIKE '%Santo Por Siempre%';

NOTIFY pgrst, 'reload schema';
