UPDATE public.games
SET title = 'Adivina la palabra',
    description = 'Adivina palabras bíblicas eligiendo o escribiendo letras. Cada error resta una oportunidad y cada acierto te enseña su referencia.',
    image_url = '/images/games/covers/reto-letras.webp'
WHERE slug = 'ahorcado-biblico';
