import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { AnalysedClaimsResult } from 'src/types';

export type InfluencerClaims = Claim & Document;

@Schema()
export class Claim {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  claim: AnalysedClaimsResult[];

  @Prop({ required: true })
  last_updated: number;
}

export const ClaimSchema = SchemaFactory.createForClass(Claim);
