import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Claim, InfluencerClaims } from 'src/research/claims.schema';
import { IGetInfluencerResponse } from 'src/types';
import { getInfluencerDetails } from 'src/utils';

@Injectable()
export class InfluencerService {
  constructor(
    @InjectModel(Claim.name) private claimModel: Model<InfluencerClaims>,
  ) {}
  async getInfluencerDetails(id: string): Promise<IGetInfluencerResponse> {
    try {
      const detail = (await getInfluencerDetails(
        this.claimModel,
        id,
      )) as InfluencerClaims;

      return {
        success: true,
        data: {
          detail,
          average_trust_score: detail.average_trust_score,
          categories: detail.categories,
          total_claims: detail.claim.length,
        },
      };
    } catch (error) {
      console.log(error);
      return {
        success: false,
        data: {} as any,
      };
    }
  }
}
