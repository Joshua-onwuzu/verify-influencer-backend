import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Claim, InfluencerClaims } from 'src/research/claims.schema';
import { IGetInfluencerResponse } from 'src/types';
import { calculateAverageTrustScore, getInfluencerDetails } from 'src/utils';

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
      const result = calculateAverageTrustScore(detail.claim);

      return {
        success: true,
        data: {
          detail,
          average_trust_score: result.averageTrustScore,
          categories: result.catergory as string[],
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
