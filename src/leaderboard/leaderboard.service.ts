import { Injectable } from '@nestjs/common';
import { IGetLeaderboardResponse } from 'src/types';
import { Claim, InfluencerClaims } from '../research/claims.schema';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { filterByCategory } from 'src/utils';

@Injectable()
export class LeaderboardService {
  constructor(
    @InjectModel(Claim.name) private claimModel: Model<InfluencerClaims>,
  ) {}
  async getLeaderboard(category: string): Promise<IGetLeaderboardResponse> {
    let claims = await this.claimModel.find().exec();
    if (category) {
      claims = await filterByCategory(this.claimModel, category);
    }
    return {
      success: true,
      data: {
        claims,
      },
    };
  }
}
