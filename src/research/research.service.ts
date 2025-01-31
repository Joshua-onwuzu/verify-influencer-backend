/* eslint-disable @typescript-eslint/no-floating-promises */
import { Body, Injectable } from '@nestjs/common';
import {
  AnalysedClaimsResult,
  IJob,
  ResearchInfluencerPayload,
} from '../types';
import {
  analyzeForHealthRelatedClaims,
  searchPodcast,
  searchTwitter,
  updateOrCreateClaimCategoryRecord,
  updateOrCreateClaimRecord,
} from '../utils';
import { Claim, InfluencerClaims } from './claims.schema';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Category, ClaimCategory } from '../schema/category.schema';
import { decryptKey, privateKey } from '../utils/crypto';
import { randomUUID } from 'crypto';

@Injectable()
export class ResearchService {
  constructor(
    @InjectModel(Claim.name) private claimModel: Model<InfluencerClaims>,
    @InjectModel(Category.name) private categoryModel: Model<ClaimCategory>,
  ) {}
  researchInfluencer(
    @Body() data: ResearchInfluencerPayload,
    fn: (data: IJob) => void,
  ): {
    success: boolean;
    message: string;
    job: IJob | null;
  } {
    const {
      name,
      time,
      listen_notes_key,
      claim_size,
      openAi_key,
      assemblyAi_key,
      perplexity_key,
      twitter_bearer_token,
      selected_journals,
    } = data;

    const jobId = randomUUID();

    const job: IJob = {
      id: jobId,
      claimId: '',
      status: 'pending',
    };
    if (!name || !time || !claim_size) {
      return {
        success: false,
        message: 'Invalid params',
        job: null,
      };
    }

    const handleSearch = async () => {
      const twitterSearchResult = await searchTwitter(
        name,
        twitter_bearer_token,
        claim_size,
        time,
      );
      const podcastSearchResult = await searchPodcast(
        name,
        listen_notes_key,
        assemblyAi_key,
        claim_size,
        time,
      );
      if (
        twitterSearchResult.length === 0 &&
        podcastSearchResult.length === 0
      ) {
        await updateOrCreateClaimRecord([], name, this.claimModel);
        await updateOrCreateClaimCategoryRecord([], this.categoryModel);
        const result = await this.claimModel.findOne({ name });
        job.claimId = result?._id as string;
        job.status = 'completed';
        fn(job);
        return;
      }

      const previousClaims = ((await this.claimModel
        .findOne({ name })
        .exec()) || []) as AnalysedClaimsResult[];

      analyzeForHealthRelatedClaims(
        [...twitterSearchResult, ...podcastSearchResult],
        previousClaims,
        selected_journals,
        {
          openAi_key: decryptKey(privateKey, openAi_key),
          perplexity_key: decryptKey(privateKey, perplexity_key),
        },
      ).then(async (analyzedResult) => {
        await updateOrCreateClaimRecord(analyzedResult, name, this.claimModel);
        const resultCategories = analyzedResult.map((data) => data.category);

        await updateOrCreateClaimCategoryRecord(
          resultCategories,
          this.categoryModel,
        );
        const result = await this.claimModel.findOne({ name });
        job.claimId = result?._id as string;
        job.status = 'completed';
        fn(job);
      });
    };
    handleSearch();

    fn(job);

    return {
      success: true,
      job,
      message: 'job queued',
    };
  }
}
