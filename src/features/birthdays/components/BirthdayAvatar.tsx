import { useState } from 'react';
import type { BirthdayInfo } from '../hooks/useBirthdays';

interface BirthdayAvatarProps {
  item: BirthdayInfo;
  sizeClassName?: string;
  textClassName?: string;
  shapeClassName?: string;
}

export function BirthdayAvatar({ item, sizeClassName = 'h-10 w-10', textClassName = 'text-xs', shapeClassName = 'rounded-full' }: BirthdayAvatarProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const fullName = `${item.member.first_name} ${item.member.last_name}`.trim();
  const initials = `${item.member.first_name[0] ?? ''}${item.member.last_name[0] ?? ''}`.toUpperCase();

  return (
    <div className={`${sizeClassName} ${shapeClassName} shrink-0 overflow-hidden bg-primary text-white ring-1 ring-white/20`}>
      {item.member.photo_url && !imageFailed ? (
        <img
          loading="lazy"
          src={item.member.photo_url}
          alt={`Foto de ${fullName}`}
          onError={() => setImageFailed(true)}
          className="h-full w-full object-cover"
        />
      ) : (
        <span className={`flex h-full w-full items-center justify-center font-bold ${textClassName}`} aria-hidden="true">
          {initials}
        </span>
      )}
    </div>
  );
}
