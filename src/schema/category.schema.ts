import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ClaimCategory = Category & Document;

@Schema()
export class Category {
  @Prop({ type: [String], default: [], unique: true })
  categories: string[];
}

export const CategorySchema = SchemaFactory.createForClass(Category);
