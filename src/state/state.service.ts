// src/state/state.service.ts
import { Injectable } from '@nestjs/common';
import { IJob } from 'src/types';

@Injectable()
export class StateService {
  private jobResult = new Map<string, IJob>();

  setJobResult(data: IJob) {
    this.jobResult.set(data.id, data);
  }

  getJobResult(id: string) {
    return {
      job: this.jobResult.get(id),
    };
  }
}
