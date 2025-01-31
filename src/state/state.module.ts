import { Module } from '@nestjs/common';
import { StateService } from './state.service';
import { StateController } from './state.controller';

@Module({
  providers: [StateService],
  controllers: [StateController],
  exports: [StateService], // so we can inject StateService in other modules
})
export class StateModule {}
