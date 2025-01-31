import { Body, Injectable } from '@nestjs/common';
import { AnalysedClaimsResult, ResearchInfluencerPayload } from '../types';
import {
  analyzeForHealthRelatedClaims,
  searchTwitter,
  updateOrCreateClaimCategoryRecord,
  updateOrCreateClaimRecord,
} from '../utils';
import { Claim, InfluencerClaims } from './claims.schema';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Category, ClaimCategory } from '../schema/category.schema';
import { decryptKey, privateKey } from '../utils/crypto';

@Injectable()
export class ResearchService {
  constructor(
    @InjectModel(Claim.name) private claimModel: Model<InfluencerClaims>,
    @InjectModel(Category.name) private categoryModel: Model<ClaimCategory>,
  ) {}
  async researchInfluencer(@Body() data: ResearchInfluencerPayload): Promise<{
    data: AnalysedClaimsResult[];
    id: string;
    success: boolean;
    message: string;
  }> {
    try {
      const {
        name,
        searches,
        claim_size,
        openAi_key,
        perplexity_key,
        selected_journals,
        time,
        twitter_bearer_token,
      } = data;
      if (!name || !claim_size) {
        return {
          success: false,
          message: 'Invalid params',
          data: [],
          id: '',
        };
      }

      const twitterSearchResult = await searchTwitter(
        name,
        twitter_bearer_token,
        claim_size,
        time,
      );

      const previousClaims = ((await this.claimModel
        .findOne({ name })
        .exec()) || []) as AnalysedClaimsResult[];

      const analyzedResult = await analyzeForHealthRelatedClaims(
        [...searches, ...twitterSearchResult],
        previousClaims,
        selected_journals,
        {
          openAi_key: decryptKey(privateKey, openAi_key),
          perplexity_key: decryptKey(privateKey, perplexity_key),
        },
      );

      await updateOrCreateClaimRecord(analyzedResult, name, this.claimModel);

      const resultCategories = analyzedResult.map((data) => data.category);

      await updateOrCreateClaimCategoryRecord(
        resultCategories,
        this.categoryModel,
      );

      const result = await this.claimModel.findOne({ name });

      return {
        success: true,
        data: result?.claim || [],
        id: result?._id as string,
        message: '',
      };
    } catch (error) {
      return {
        success: false,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
        message: error.message || 'Failed to make research',
        data: [],
        id: '',
      };
    }
  }
}
