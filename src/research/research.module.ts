import { Module } from '@nestjs/common';
import { ResearchController } from './research.controller';
import { ResearchService } from './research.service';
import { MongooseModule } from '@nestjs/mongoose';
import { ClaimSchema, Claim } from './claims.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Claim.name, schema: ClaimSchema }]),
  ],
  controllers: [ResearchController],
  providers: [ResearchService],
})
export class ResearchModule {}
