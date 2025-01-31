import { Module } from '@nestjs/common';
import { GeneralInfoService } from './general-info.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Category, CategorySchema } from '../schema/category.schema';
import { GeneralInfoController } from './general-info.controller';
import { Claim, ClaimSchema } from '../research/claims.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Category.name, schema: CategorySchema },
    ]),
    MongooseModule.forFeature([{ name: Claim.name, schema: ClaimSchema }]),
  ],
  controllers: [GeneralInfoController],
  providers: [GeneralInfoService],
})
export class GenralInfoModule {}
