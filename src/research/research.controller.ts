import { Controller, Post, Body } from '@nestjs/common';
import { ResearchService } from './research.service';
import { ResearchInfluencerPayload } from '../types';

@Controller('research')
export class ResearchController {
  constructor(private readonly researchService: ResearchService) {}

  @Post()
  createResearch(@Body() researchData: ResearchInfluencerPayload) {
    return this.researchService.researchInfluencer(researchData);
  }
}
