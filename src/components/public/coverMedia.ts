export type CoverMediaType = 'image' | 'video';

export const getCoverMediaType = (
  mediaType: CoverMediaType | null | undefined,
  imageUrl: string | null | undefined,
  videoUrl: string | null | undefined,
): CoverMediaType => {
  if (mediaType === 'image' || mediaType === 'video') return mediaType;
  return imageUrl ? 'image' : videoUrl ? 'video' : 'image';
};
