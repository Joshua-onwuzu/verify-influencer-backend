import { Module } from '@nestjs/common';
import { InfluencerController } from './influnencer.controller';
import { InfluencerService } from './influencer.service';

@Module({
  controllers: [InfluencerController],
  providers: [InfluencerService],
})
export class InfluencerModule {}
