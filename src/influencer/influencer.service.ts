import { Injectable } from '@nestjs/common';
import { IGetInfluencerDetails } from 'src/types';

@Injectable()
export class InfluencerService {
  getInfluencerDetails(): IGetInfluencerDetails {
    // Pull influencers from database
    // return single influencer information base on params
    return {
      success: true,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      profile: {} as any,
      claims: [],
    };
  }
}
