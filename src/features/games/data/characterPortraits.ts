export type CharacterPortrait = {
  name: string;
  imagePath: string;
  origin: 'generated' | 'memory-game';
  alt: string;
};

/**
 * Índice de representaciones artísticas de los personajes de «Descubre el Personaje».
 * Las imágenes nuevas son ilustraciones generadas para este juego; las existentes
 * conservan su ubicación original dentro del Memorama Bíblico.
 */
export const characterPortraits: CharacterPortrait[] = [
  { name: 'Aarón', imagePath: '/images/games/characters/aaron.webp', origin: 'generated', alt: 'Aarón con vestiduras sacerdotales en el antiguo Israel' },
  { name: 'Abigail', imagePath: '/images/games/characters/abigail.webp', origin: 'generated', alt: 'Abigail en un camino de la antigua Judea' },
  { name: 'Abraham', imagePath: '/images/games/characters/abraham.webp', origin: 'generated', alt: 'Abraham junto a su campamento' },
  { name: 'Agar', imagePath: '/images/games/characters/agar.webp', origin: 'generated', alt: 'Agar y su hijo en el desierto' },
  { name: 'Andrés', imagePath: '/images/games/characters/andres.webp', origin: 'generated', alt: 'Andrés, pescador de Galilea' },
  { name: 'Bartimeo', imagePath: '/images/games/characters/bartimeo.webp', origin: 'generated', alt: 'Bartimeo en una calle de Jericó' },
  { name: 'Bernabé', imagePath: '/images/games/characters/bernabe.webp', origin: 'generated', alt: 'Bernabé junto a una comunidad cristiana del primer siglo' },
  { name: 'Cornelio', imagePath: '/images/games/characters/cornelio.webp', origin: 'generated', alt: 'Cornelio, centurión romano en Cesarea' },
  { name: 'Daniel', imagePath: '/images/games/characters/daniel.webp', origin: 'generated', alt: 'Daniel en la antigua Babilonia' },
  { name: 'David', imagePath: '/images/games/memory/objects/espada-david-relato.webp', origin: 'memory-game', alt: 'David en una escena ilustrada de su relato bíblico' },
  { name: 'Débora', imagePath: '/images/games/characters/debora.webp', origin: 'generated', alt: 'Débora bajo una palmera en Israel' },
  { name: 'Elías', imagePath: '/images/games/characters/elias.webp', origin: 'generated', alt: 'Elías en el paisaje montañoso de Israel' },
  { name: 'Esdras', imagePath: '/images/games/characters/esdras.webp', origin: 'generated', alt: 'Esdras con un rollo en la antigua Jerusalén' },
  { name: 'Ester', imagePath: '/images/games/characters/ester.webp', origin: 'generated', alt: 'Ester en los jardines del palacio de Susa' },
  { name: 'Felipe el evangelista', imagePath: '/images/games/characters/felipe-el-evangelista.webp', origin: 'generated', alt: 'Felipe el evangelista en un camino antiguo' },
  { name: 'Gedeón', imagePath: '/images/games/characters/gedeon.webp', origin: 'generated', alt: 'Gedeón trabajando el trigo en Israel' },
  { name: 'Jairo', imagePath: '/images/games/characters/jairo.webp', origin: 'generated', alt: 'Jairo en una calle de Galilea' },
  { name: 'Jonás', imagePath: '/images/games/characters/jonas.webp', origin: 'generated', alt: 'Jonás junto a la costa del Mediterráneo' },
  { name: 'José (hijo de Jacob)', imagePath: '/images/games/characters/jose-hijo-de-jacob.webp', origin: 'generated', alt: 'José en un patio del antiguo Egipto' },
  { name: 'Josué', imagePath: '/images/games/characters/josue.webp', origin: 'generated', alt: 'Josué frente a las murallas de Jericó' },
  { name: 'Juan el Bautista', imagePath: '/images/games/characters/juan-el-bautista.webp', origin: 'generated', alt: 'Juan el Bautista junto al río Jordán' },
  { name: 'Lidia', imagePath: '/images/games/characters/lidia.webp', origin: 'generated', alt: 'Lidia con telas púrpuras en Filipos' },
  { name: 'María (madre de Jesús)', imagePath: '/images/games/characters/maria-madre-de-jesus.webp', origin: 'generated', alt: 'María, madre de Jesús, en Nazaret' },
  { name: 'Marta', imagePath: '/images/games/characters/marta.webp', origin: 'generated', alt: 'Marta en el patio de su hogar en Betania' },
  { name: 'Matías', imagePath: '/images/games/characters/matias.webp', origin: 'generated', alt: 'Matías junto a una comunidad cristiana de Jerusalén' },
  { name: 'Micaías hijo de Imla', imagePath: '/images/games/characters/micaias-hijo-de-imla.webp', origin: 'generated', alt: 'Micaías hijo de Imla ante la corte de Samaria' },
  { name: 'Miriam', imagePath: '/images/games/characters/miriam.webp', origin: 'generated', alt: 'Miriam celebrando junto a otras mujeres de Israel' },
  { name: 'Moisés', imagePath: '/images/games/memory/moises.jpg', origin: 'memory-game', alt: 'Moisés con las tablas de la Ley' },
  { name: 'Naaman', imagePath: '/images/games/characters/naaman.webp', origin: 'generated', alt: 'Naamán en la ribera del río Jordán' },
  { name: 'Nicodemo', imagePath: '/images/games/characters/nicodemo.webp', origin: 'generated', alt: 'Nicodemo en un patio de Jerusalén' },
  { name: 'Noé', imagePath: '/images/games/memory/noe.jpg', origin: 'memory-game', alt: 'Noé junto al arca' },
  { name: 'Onésimo', imagePath: '/images/games/characters/onesimo.webp', origin: 'generated', alt: 'Onésimo en un camino de la época romana' },
  { name: 'Pablo', imagePath: '/images/games/memory/objects/cadenas-pablo-relato.webp', origin: 'memory-game', alt: 'Pablo y Silas en prisión' },
  { name: 'Pedro', imagePath: '/images/games/memory/objects/pez-moneda-relato.webp', origin: 'memory-game', alt: 'Pedro junto a Jesús y el mar de Galilea' },
  { name: 'Priscila', imagePath: '/images/games/characters/priscila.webp', origin: 'generated', alt: 'Priscila en su taller de confección de tiendas' },
  { name: 'Rut', imagePath: '/images/games/characters/rut.webp', origin: 'generated', alt: 'Rut recogiendo espigas en un campo de Judea' },
  { name: 'Samuel', imagePath: '/images/games/characters/samuel.webp', origin: 'generated', alt: 'Samuel en el antiguo santuario de Silo' },
  { name: 'Simeón de Jerusalén', imagePath: '/images/games/characters/simeon-de-jerusalen.webp', origin: 'generated', alt: 'Simeón de Jerusalén junto a los primeros cristianos' },
  { name: 'Timoteo', imagePath: '/images/games/characters/timoteo.webp', origin: 'generated', alt: 'Timoteo en una calle de la antigua Éfeso' },
  { name: 'Zaqueo', imagePath: '/images/games/characters/zaqueo.webp', origin: 'generated', alt: 'Zaqueo junto a un sicómoro en Jericó' },
];

const normalizeCharacterName = (name: string): string => name
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLocaleLowerCase('es')
  .replace(/[()]/g, '')
  .replace(/[^a-z0-9]+/g, ' ')
  .trim();

const portraitByName = new Map(characterPortraits.map((portrait) => [normalizeCharacterName(portrait.name), portrait]));

export const getCharacterPortrait = (name: string): CharacterPortrait | undefined =>
  portraitByName.get(normalizeCharacterName(name));
