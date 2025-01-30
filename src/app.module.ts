import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { LeaderboardModule } from './leaderboard/leaderboard.module';
import { InfluencerModule } from './influencer/influencer.module';
import { ResearchModule } from './research/research.module';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { GenralInfoModule } from './general-info/general-info.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRoot(process.env.MONGO_URL || ''),
    LeaderboardModule,
    InfluencerModule,
    ResearchModule,
    GenralInfoModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
