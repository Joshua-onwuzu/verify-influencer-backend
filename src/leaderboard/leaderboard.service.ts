import { Injectable } from '@nestjs/common';
import { IGetLeaderboardResponse } from 'src/types';
import { Claim, InfluencerClaims } from '../research/claims.schema';
import { Category, ClaimCategory } from 'src/schema/category.schema';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import {
  filterByCategory,
  getCategories,
  getTotalVerifiedClaimAndAverageTrustScore,
} from 'src/utils';

@Injectable()
export class LeaderboardService {
  constructor(
    @InjectModel(Claim.name) private claimModel: Model<InfluencerClaims>,
    @InjectModel(Category.name) private categoryModel: Model<ClaimCategory>,
  ) {}
  async getLeaderboard(category: string): Promise<IGetLeaderboardResponse> {
    const categories = await getCategories(this.categoryModel);
    let claims = await this.claimModel.find().exec();
    const { total_verified_claims, average_trust_score } =
      getTotalVerifiedClaimAndAverageTrustScore(claims);

    if (category) {
      claims = await filterByCategory(this.claimModel, category);
    }
    return {
      success: true,
      data: {
        categories,
        total_claims: await this.claimModel.countDocuments().exec(),
        total_verified_claims,
        average_trust_score,
        claims,
      },
    };
  }
}
