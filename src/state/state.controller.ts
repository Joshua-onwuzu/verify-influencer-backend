import { Controller, Get, Query } from '@nestjs/common';
import { StateService } from './state.service';

@Controller('state')
export class StateController {
  constructor(private readonly stateService: StateService) {}

  // Returns the result that was previously set
  @Get()
  getJobResult(@Query('id') id: string) {
    return this.stateService.getJobResult(id);
  }
}
