import { useState } from 'react';
import { ImageOff } from 'lucide-react';
import { getCharacterPortrait } from '../data/characterPortraits';

type CharacterRevealPortraitProps = {
  characterName: string;
  imageUrl?: string | null;
};

export const CharacterRevealPortrait = ({ characterName, imageUrl }: CharacterRevealPortraitProps) => {
  const portrait = getCharacterPortrait(characterName);
  const [remoteImageFailed, setRemoteImageFailed] = useState(false);
  const localImage = portrait?.imagePath;
  const imageSrc = imageUrl && !remoteImageFailed ? imageUrl : localImage;

  if (!imageSrc) {
    return (
      <div className="mb-4 flex h-40 w-full max-w-md flex-col items-center justify-center rounded-2xl border border-slate-200 bg-slate-100 text-slate-500 dark:border-white/10 dark:bg-slate-800 dark:text-slate-300">
        <ImageOff aria-hidden="true" size={28} />
        <span className="mt-2 text-sm font-medium">Ilustración no disponible</span>
      </div>
    );
  }

  return (
    <figure className="mb-4 w-full max-w-md">
      <div className="overflow-hidden rounded-2xl border border-amber-200/80 bg-slate-100 shadow-lg shadow-slate-950/10 dark:border-amber-300/20 dark:bg-slate-800">
        <img
          src={imageSrc}
          alt={portrait?.alt ?? `Representación artística de ${characterName}`}
          className="h-40 w-full object-cover sm:h-48"
          loading="eager"
          decoding="async"
          onError={() => {
            if (imageUrl && !remoteImageFailed) setRemoteImageFailed(true);
          }}
        />
      </div>
      <figcaption className="mt-1.5 text-center text-xs text-slate-500 dark:text-slate-400">
        Representación artística del personaje bíblico.
      </figcaption>
    </figure>
  );
};
