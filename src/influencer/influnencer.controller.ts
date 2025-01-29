import { Controller, Get, Query } from '@nestjs/common';
import { InfluencerService } from './influencer.service';

@Controller('influencer')
export class InfluencerController {
  constructor(private readonly influencerService: InfluencerService) {}

  @Get('details')
  getInfluencerDetails(@Query('id') id: string) {
    return this.influencerService.getInfluencerDetails(id);
  }
}
