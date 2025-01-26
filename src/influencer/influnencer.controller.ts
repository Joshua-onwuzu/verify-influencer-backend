import { Controller, Get } from '@nestjs/common';
import { InfluencerService } from './influencer.service';

@Controller('influencer')
export class InfluencerController {
  constructor(private readonly influencerService: InfluencerService) {}

  @Get('details')
  getInfluencerDetails() {
    return this.influencerService.getInfluencerDetails();
  }
}
