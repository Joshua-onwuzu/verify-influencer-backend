import { Injectable } from '@nestjs/common';
import { ResearchInfluencerPayload } from 'src/types';
import {
  analyzeForHealthRelatedClaims,
  searchPodcast,
  searchTwitter,
  updateOrCreateClaimRecord,
} from 'src/utils';
import { Claim, InfluencerClaims } from './claims.schema';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';

@Injectable()
export class ResearchService {
  constructor(
    @InjectModel(Claim.name) private claimModel: Model<InfluencerClaims>,
  ) {}
  async researchInfluencer(data: ResearchInfluencerPayload) {
    try {
      const { name } = data;
      console.log('1');
      const twitterSearchResult = await searchTwitter(name);
      console.log('2');
      const podcastSearchResult = await searchPodcast(name);
      if (
        twitterSearchResult.length === 0 &&
        podcastSearchResult.length === 0
      ) {
        return {
          success: true,
          data: [],
          message: 'No data found',
        };
      }
      console.log('3');
      const analyzedResult = await analyzeForHealthRelatedClaims([
        ...twitterSearchResult,
        ...podcastSearchResult,
      ]);

      const response = await updateOrCreateClaimRecord(
        analyzedResult,
        name,
        this.claimModel,
      );

      console.log(response);

      return {
        success: true,
        data: analyzedResult,
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
