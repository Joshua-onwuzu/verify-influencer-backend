import { Injectable } from '@nestjs/common';
import { Category, ClaimCategory } from '../schema/category.schema';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import {
  getCategories,
  getTotalVerifiedClaimAndAverageTrustScore,
} from '../utils';
import { IGetGeneralInfoResponse } from '../types';
import { Claim, InfluencerClaims } from '../research/claims.schema';

@Injectable()
export class GeneralInfoService {
  constructor(
    @InjectModel(Claim.name) private claimModel: Model<InfluencerClaims>,
    @InjectModel(Category.name) private categoryModel: Model<ClaimCategory>,
  ) {}
  async getGeneralInfo(): Promise<IGetGeneralInfoResponse> {
    const categories = await getCategories(this.categoryModel);
    const { total_verified_claims, average_trust_score } =
      await getTotalVerifiedClaimAndAverageTrustScore(this.claimModel);
    return {
      success: true,
      data: {
        categories,
        total_claims: await this.claimModel.countDocuments().exec(),
        total_verified_claims,
        average_trust_score,
      },
    };
  }
}
