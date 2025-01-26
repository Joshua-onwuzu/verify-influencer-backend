import { Injectable } from '@nestjs/common';
import { IGetLeaderboardResponse } from 'src/types';

@Injectable()
export class LeaderboardService {
  getLeaderboard(): IGetLeaderboardResponse {
    // connect to database
    // pull and return all influencer profiles
    // arrange in desc based on their trust score
    return {
      success: true,
      data: [],
    };
  }
}
