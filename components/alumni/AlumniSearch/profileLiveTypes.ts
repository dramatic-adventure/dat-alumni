// components/alumni/AlumniSearch/profileLiveTypes.ts
export type ProfileLiveRow = {
  name: string;
  alumniId?: string;
  email?: string;
  slug: string;

  pronouns?: string;
  roles?: string;            // ← NOTE: appears string in sheet
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
  programs?: string;         // usually CSV or pipe list
  tags?: string;             // usually CSV or pipe list
  statusFlags?: string;      // usually CSV or pipe list
  isPublic?: string;
  status?: string;
  updatedAt?: string;

  currentHeadshotId?: string;
  currentHeadshotUrl?: string;

  featuredAlbumId?: string;
  featuredReelId?: string;
  featuredEventId?: string;
};
