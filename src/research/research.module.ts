import { Module } from '@nestjs/common';
import { ResearchController } from './research.controller';
import { ResearchService } from './research.service';
import { MongooseModule } from '@nestjs/mongoose';
import { ClaimSchema, Claim } from './claims.schema';
import { Category, CategorySchema } from '../schema/category.schema';
import { StateModule } from '../state/state.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Claim.name, schema: ClaimSchema },
      { name: Category.name, schema: CategorySchema },
    ]),
    StateModule,
  ],
  controllers: [ResearchController],
  providers: [ResearchService],
})
export class ResearchModule {}
