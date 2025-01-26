import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { LeaderboardModule } from './leaderboard/leaderboard.module';
import { InfluencerModule } from './influencer/influencer.module';
import { ResearchModule } from './research/research.module';

@Module({
  imports: [LeaderboardModule, InfluencerModule, ResearchModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
