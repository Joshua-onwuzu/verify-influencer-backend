import { Injectable } from '@nestjs/common';
import { ResearchInfluencerPayload } from 'src/types';
import {
  analyzeForHealthRelatedClaims,
  searchPodcast,
  searchTwitter,
} from 'src/utils';

@Injectable()
export class ResearchService {
  async researchInfluencer(data: ResearchInfluencerPayload) {
    try {
      const { name } = data;
      console.log('1');
      // const twitterSearchResult = await searchTwitter(name);
      console.log('2');
      const podcastSearchResult = await searchPodcast(name);
      console.log('3');
      const analyzedResult = await analyzeForHealthRelatedClaims([
        // ...twitterSearchResult,
        ...podcastSearchResult,
      ]);
      console.log('finalie');

      return {
        success: true,
        data: [],
        analyzedResult,
        podcastSearchResult,
        // twitterSearchResult,
      };
    } catch (error) {
      return {
        success: false,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
        message: error.message || 'Failed to make research',
        data: [],
      };
    }
  }
}
