import { Controller, Post, Body } from '@nestjs/common';
import { ResearchService } from './research.service';
import { IJob, ResearchInfluencerPayload } from '../types';
import { StateService } from 'src/state/state.service';

@Controller('research')
export class ResearchController {
  constructor(
    private readonly researchService: ResearchService,
    private readonly stateService: StateService,
  ) {}

  @Post()
  createResearch(@Body() researchData: ResearchInfluencerPayload) {
    return this.researchService.researchInfluencer(
      researchData,
      (result: IJob) => {
        this.stateService.setJobResult(result);
      },
    );
  }
}
