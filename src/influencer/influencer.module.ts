import { Module } from '@nestjs/common';
import { InfluencerController } from './influnencer.controller';
import { InfluencerService } from './influencer.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Claim, ClaimSchema } from 'src/research/claims.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Claim.name, schema: ClaimSchema }]),
  ],
  controllers: [InfluencerController],
  providers: [InfluencerService],
})
export class InfluencerModule {}
