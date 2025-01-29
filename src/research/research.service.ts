import { Injectable } from '@nestjs/common';
import { AnalysedClaimsResult, ResearchInfluencerPayload } from 'src/types';
import {
  analyzeForHealthRelatedClaims,
  searchPodcast,
  searchTwitter,
  updateOrCreateClaimCategoryRecord,
  updateOrCreateClaimRecord,
} from 'src/utils';
import { Claim, InfluencerClaims } from './claims.schema';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Category, ClaimCategory } from 'src/schema/category.schema';

@Injectable()
export class ResearchService {
  constructor(
    @InjectModel(Claim.name) private claimModel: Model<InfluencerClaims>,
    @InjectModel(Category.name) private categoryModel: Model<ClaimCategory>,
  ) {}
  async researchInfluencer(data: ResearchInfluencerPayload) {
    try {
      const {
        name,
        time,
        listen_notes_key,
        claim_size,
        openAi_key,
        assemblyAi_key,
        perplexity_key,
        twitter_bearer_token,
      } = data;
      const twitterSearchResult = await searchTwitter(
        name,
        twitter_bearer_token,
        claim_size,
        time,
      );
      const podcastSearchResult = await searchPodcast(
        name,
        listen_notes_key,
        assemblyAi_key,
        claim_size,
        time,
      );
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
      const previousClaims = ((await this.claimModel
        .findOne({ name })
        .exec()) || []) as AnalysedClaimsResult[];

      const analyzedResult = await analyzeForHealthRelatedClaims(
        [...twitterSearchResult, ...podcastSearchResult],
        previousClaims,
        {
          openAi_key,
          perplexity_key,
        },
      );

      await updateOrCreateClaimRecord(analyzedResult, name, this.claimModel);

      const resultCategories = analyzedResult.map((data) => data.category);

      await updateOrCreateClaimCategoryRecord(
        resultCategories,
        this.categoryModel,
      );

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
