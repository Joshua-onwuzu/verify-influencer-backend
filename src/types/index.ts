export type InfluencerProfile = {
  name: string;
  category: string[];
  trust_score: number;
  followers: number;
  verified_claims: number;
};

export interface IApiResponse {
  success: boolean;
  message?: string;
}

export interface IGetLeaderboardResponse extends IApiResponse {
  data: InfluencerProfile[];
}

export enum ClaimStatus {
  VERIFIED = 'verified',
  QUESTIONABLE = 'questionable',
  DEBUNKED = 'debunked',
}

export interface IClaims {
  title: string;
  content: string;
  verification_status: ClaimStatus;
  category: string;
  journal: string[];
}

export interface IGetInfluencerDetails extends IApiResponse {
  profile: InfluencerProfile;
  claims: IClaims[];
}

export enum Time {
  ALL_TIME,
  LAST_WEEK,
  LAST_MONTH,
  LAST_YEAR,
}

export type Journal = 'chat-gpt' | 'op-mesa';

export type ResearchInfluencerPayload = {
  time: Time;
  name: string;
  claim_size: number;
  selected_journals: Journal[];
};

export interface IResearchInfluencerResponse extends IApiResponse {
  data: IClaims[];
}

export type PodcastEpisode = {
  audio: string;
  audio_length_sec: number;
  rss: string;
  description_highlighted: string;
  description_original: string;
  title_highlighted: string;
  title_original: string;
  transcripts_highlighted: string[];
  image: string;
  thumbnail: string;
  itunes_id: number;
  pub_date_ms: number;
  id: string;
  listennotes_url: string;
  explicit_content: boolean;
  link: string;
  guid_from_rss: string;
  podcast: {
    listennotes_url: string;
    id: string;
    title_highlighted: string;
    title_original: string;
    publisher_highlighted: string;
    publisher_original: string;
    image: string;
    thumbnail: string;
    genre_ids: number[];
    listen_score: string;
    listen_score_global_rank: string;
  };
};

export type PodcastSearchResponse = {
  data: {
    results: PodcastEpisode[];
  };
};

export type SearchQueryResult = {
  link: string;
  text: string;
};

export enum VerificationStatus {
  VERIFIED = 'Verified',
  DEBUNKED = 'Debunked',
  QUESTIONABLE = 'Questionable',
}

export type AnalysedClaimsResult = {
  claim_summary: string;
  category: string;
  link: string;
  verification_status: VerificationStatus;
  trust_score: number;
};
