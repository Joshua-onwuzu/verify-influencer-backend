import { InfluencerClaims } from '../research/claims.schema';

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
  data: {
    claims: InfluencerClaims[];
  };
}
export interface IGetInfluencerResponse extends IApiResponse {
  data: {
    detail: InfluencerClaims;
    average_trust_score: string;
    total_claims: number;
    categories: string[];
  };
}

export enum ClaimStatus {
  VERIFIED = 'verified',
  QUESTIONABLE = 'questionable',
  DEBUNKED = 'debunked',
}

export enum Time {
  ALL_TIME = 'ALL_TIME',
  LAST_WEEK = 'LAST_WEEK',
  LAST_MONTH = 'LAST_MONTH',
  LAST_YEAR = 'LAST_YEAR',
}
export enum Journal {
  NEJM = 'The New England Journal of Medicine (NEJM)',
  Lancet = 'The Lancet',
  JAMA = 'JAMA (Journal of the American Medical Association)',
  BMJ = 'BMJ (British Medical Journal)',
  NatureMedicine = 'Nature Medicine',
  PLOSMedicine = 'PLOS Medicine',
  CID = 'Clinical Infectious Diseases (CID)',
  AnnalsIM = 'Annals of Internal Medicine',
}

export type ResearchInfluencerPayload = {
  time: Time;
  name: string;
  claim_size: number;
  selected_journals: Journal[];
  openAi_key: string;
  assemblyAi_key: string;
  perplexity_key: string;
  listen_notes_key: string;
  twitter_bearer_token: string;
};
export interface IGetGeneralInfoResponse extends IApiResponse {
  data: {
    categories: string[];
    total_claims: number;
    total_verified_claims: number;
    average_trust_score: number;
  };
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
export interface ISearchInfluencerResponse extends IApiResponse {
  data: {
    search: SearchQueryResult[];
  };
}

export interface IJob {
  id: string;
  status: 'pending' | 'completed' | 'error';
  claimId: string;
  message: string;
  isEmpty: boolean;
}
