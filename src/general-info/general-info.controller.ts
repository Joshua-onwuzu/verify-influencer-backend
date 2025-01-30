import { Controller, Get } from '@nestjs/common';
import { GeneralInfoService } from './general-info.service';

@Controller('general-info')
export class GeneralInfoController {
  constructor(private readonly generalInfoService: GeneralInfoService) {}

  @Get()
  getCategories() {
    return this.generalInfoService.getGeneralInfo();
  }
}
