// components/alumni/AlumniSearch/profileLiveTypes.ts
export type ProfileLiveRow = {
  name: string;
  alumniId?: string;
  slug: string;

  // ✅ public-facing contact only (optional)
  publicEmail?: string;

  pronouns?: string;
  roles?: string;
  location?: string;
  currentWork?: string;

  bioShort?: string;
  bioLong?: string;

  website?: string;
  instagram?: string;
  youtube?: string;
  vimeo?: string;
  imdb?: string;

  spotlight?: string;
  programs?: string;
  tags?: string;
  statusFlags?: string;
  isPublic?: string;
  status?: string;
  updatedAt?: string;

  currentHeadshotId?: string;
  currentHeadshotUrl?: string;

  featuredAlbumId?: string;
  featuredReelId?: string;
  featuredEventId?: string;

  // ✅ if you’re using this now
  languages?: string;
};
