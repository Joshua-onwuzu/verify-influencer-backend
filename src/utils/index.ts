/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */

import { TwitterApi } from 'twitter-api-v2';
import { Client } from 'podcast-api';
import { AssemblyAI } from 'assemblyai';
import {
  AnalysedClaimsResult,
  Journal,
  PodcastSearchResponse,
  SearchQueryResult,
  Time,
  VerificationStatus,
} from '../types';
import Perplexity, {
  ChatCompletionsPostRequest,
  ChatCompletionsPostRequestMessagesInner,
  ChatCompletionsPostRequestModelEnum,
} from 'perplexity-sdk';
import { InfluencerClaims } from '../research/claims.schema';
import { Model } from 'mongoose';
import OpenAI from 'openai';
import { ClaimCategory } from '../schema/category.schema';

export const searchTwitter = async (
  query: string,
  token: string,
  size: number,
  time: Time,
): Promise<SearchQueryResult[]> => {
  try {
    const twitterClient = new TwitterApi(
      token || process.env.TWITTER_BEARER_TOKEN || '',
    );
    const readOnlyClient = twitterClient.readOnly;
    const _time = getTimeRange(time);
    const start_time = _time.start?.toISOString();
    const end_time = _time.end.toISOString();
    const result = await readOnlyClient.v2.search(query, {
      start_time,
      end_time,
      max_results: size,
    });

    //@ts-ignore
    const { data } = result._realData;

    return data.map((tweet) => {
      return {
        link: `https://x.com/i/web/status/${tweet.id}`,
        text: tweet.text,
      };
    });
  } catch (error) {
    console.log(error);
    return [];
  }
};

export const convertAudioUsingOpenAI = async (url: string) => {
  const openai = new OpenAI({
    apiKey: process.env.OPEN_AI_API_KEY,
  });
  const result = await openai.chat.completions.create({
    model: 'whisper-1' as any,
    // @ts-ignore
    file: url,
  });
  // @ts-ignore
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return result.text;
};

const convertUsingAssemblyAI = async (
  audio_url: string,
  assemblyAi_key: string,
) => {
  try {
    const client = new AssemblyAI({
      apiKey: assemblyAi_key || process.env.ASSEMBLY_AI_API_KEY || '',
    });
    const transcript = await client.transcripts.transcribe({ audio_url });
    return transcript.text;
  } catch (error) {
    console.log(error);
    return '';
  }
};

export const getTranscriptFromAudioUrl = async (
  audio_url: string,
  assemblyAi_key: string,
) => {
  const response = await convertUsingAssemblyAI(audio_url, assemblyAi_key);
  return response;
};

export function getTimeRange(time: Time): { start: Date | null; end: Date } {
  const now = new Date();
  let start: Date | null = null;
  const end: Date = now;

  switch (time) {
    case Time.LAST_WEEK:
      start = new Date();
      start.setDate(now.getDate() - 7);
      break;
    case Time.LAST_MONTH:
      start = new Date();
      start.setMonth(now.getMonth() - 1);
      break;
    case Time.LAST_YEAR:
      start = new Date();
      start.setFullYear(now.getFullYear() - 1);
      break;
    case Time.ALL_TIME:
      start = null;
      break;
  }

  return { start, end };
}

export const searchPodcast = async (
  query: string,
  podcast_key: string,
  assemblyAi_key: string,
  size: number,
  time: Time,
): Promise<SearchQueryResult[]> => {
  try {
    const podcastClient = Client({
      apiKey: podcast_key || process.env.LISTEN_NOTES_API_KEY,
    });
    const _time = getTimeRange(time);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const result = (await podcastClient.search({
      q: query,
      language: 'English',
      page_size: size,
      published_before: _time.end.getTime(),
      published_after: _time.start?.getTime(),
    })) as PodcastSearchResponse;
    const resultData = result.data.results;

    return await Promise.all(
      resultData.map(async (data) => {
        const audioUrl = data.audio;
        const transcript = await getTranscriptFromAudioUrl(
          audioUrl,
          assemblyAi_key,
        );
        return {
          link: data.listennotes_url,
          text: transcript || '', // TODO: maybe we entirely skip audio that fail to return a text
        };
      }),
    );
  } catch (error) {
    console.log(error);

    return [];
  }
};

export const analyseUsingPerplexity = async (
  messages: ChatCompletionsPostRequest['messages'],
  perplexity_key: string,
) => {
  const perplexity = new Perplexity({
    apiKey: perplexity_key || process.env.PERPLEXITY_API_KEY || '',
  }).client();

  const result = await perplexity.chatCompletionsPost({
    model: 'sonar-pro' as ChatCompletionsPostRequestModelEnum,
    messages,
  });
  console.log({ result });
  const { choices } = result;
  if (!choices) return [];
  console.log({ choices });
  const { content } = choices[0]
    .message as ChatCompletionsPostRequestMessagesInner;

  console.log({ content });
  return JSON.parse(content) as AnalysedClaimsResult[];
};

export const analyseUsingOpenAi = async (
  messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[],
  openAi_key: string,
) => {
  const openai = new OpenAI({
    apiKey: openAi_key || process.env.OPEN_AI_API_KEY,
  });
  const result = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages,
  });
  const { choices } = result;
  if (!choices) return [];
  const { content } = choices[0].message;
  console.log({ content }, 'from OPEN AI');
  return JSON.parse(content || '[]') as AnalysedClaimsResult[];
};

export const analyzeForHealthRelatedClaims = async (
  contentArray: SearchQueryResult[],
  previousClaims: AnalysedClaimsResult[],
  selected_journals: Journal[],
  config: {
    openAi_key: string;
    perplexity_key: string;
  },
) => {
  if (contentArray.length === 0) return [];
  const queryInput = JSON.stringify(contentArray);
  const previousClaimsAsString = JSON.stringify(previousClaims);

  const messages = generateMessage(
    queryInput,
    previousClaimsAsString,
    selected_journals,
  );
  let response: AnalysedClaimsResult[] = [];
  try {
    console.log('here');
    response = await analyseUsingPerplexity(
      messages as ChatCompletionsPostRequest['messages'],
      config.perplexity_key,
    );
  } catch (error) {
    console.log(error, 'FROM PERPLEXITY');
  }

  if (!response.length) {
    console.log('whatys up');
    return await analyseUsingOpenAi(
      messages as OpenAI.Chat.Completions.ChatCompletionMessageParam[],
      config.openAi_key,
    );
  }
  return response;
};

export const updateOrCreateClaimRecord = async (
  claims: AnalysedClaimsResult[],
  name: string,
  model: Model<InfluencerClaims>,
) => {
  const record = await model.findOne({ name }).exec();

  if (!record) {
    const t = calculateAverageTrustScoreAndCategory(claims);
    const response = new model({
      name,
      claim: claims,
      last_updated: Date.now(),
      average_trust_score: t.averageTrustScore,
      categories: t.catergory,
    });

    return response.save();
  } else {
    const response = await model
      .findOneAndUpdate(
        { name },
        {
          $set: {
            name: record.name,
            claim: [...claims, ...record.claim],
            last_updated: Date.now(),
          },
        },
      )
      .exec();

    return response;
  }
};

export const updateInfluencerTrustScore = async (
  model: Model<InfluencerClaims>,
  {
    name,
    average_trust_score,
  }: {
    average_trust_score: string;
    name: string;
  },
) => {
  const response = await model
    .findOneAndUpdate(
      { name },
      {
        $set: {
          average_trust_score,
          last_updated: Date.now(),
        },
      },
    )
    .exec();

  return response;
};

export const updateInfluencerDetailCategory = async (
  model: Model<InfluencerClaims>,
  {
    name,
    categories,
  }: {
    categories: string[];
    name: string;
  },
) => {
  const response = await model
    .findOneAndUpdate(
      { name },
      {
        $set: {
          categories,
          last_updated: Date.now(),
        },
      },
    )
    .exec();

  return response;
};

export const initializeCollection = async (
  model: Model<ClaimCategory>,
): Promise<ClaimCategory> => {
  const existing = await model.findOne();
  if (existing) return existing;

  const newTracker = new model({ categories: [] });
  return newTracker.save();
};

export const updateOrCreateClaimCategoryRecord = async (
  result: string[],
  model: Model<ClaimCategory>,
) => {
  const categoryCollection = await initializeCollection(model);
  for (const category of result) {
    if (!categoryCollection.categories.includes(category)) {
      categoryCollection.categories.push(category);
      await categoryCollection.save();
    }
  }
};

export const generateMessage = (
  input: string,
  prevClaim: string,
  journal: Journal[],
) => {
  const supportedJournals = JSON.stringify(journal);
  const query = `here ${input} is an array of objects in JSON format analyze the "text" property of each objects and Extract distinct health-related claims (ensure there are no duplicated claims). For each claim, 
    1. Categorize it based on the subject of the claim (e.g., Nutrition, Fitness, Mental Health etc...) and associate it with its link (the link to be attached should only be gotten from the object where the text was being analysed from). 
    2. Cross-reference claims against the following medical journals given to you here ${supportedJournals} as an array of string in JSON format 
    3. Assign a "trust_score" from 1 to 100 and Determine a "verification_status": "Verified", "Questionable", or "Debunked" based on the references
    5. Collect the results as an array of objects with "claim_summary", "category", "link", "trust_score", and "verification_status"".
    6. Filter out any objects in the results where the same fact stated in "claim_summary" matches  any  "claim_summary" in ${prevClaim}
    7. Return the final result as ONLY a valid JSON array in the following structure, with no extra text:
        {
          "claim_summary": "...",
          "verification_status": "...",
          "trust_score": 0,
          "category": "..."
          "link": "..."
        },
        ...
      ]`;

  const messages = [
    {
      role: 'system',
      content: `You are a health claims analyzer and a medical research assistant that returns valid JSON answers only. `,
    },
    {
      role: 'user',
      content: query,
    },
  ];

  return messages;
};

export const getCategories = async (
  model: Model<ClaimCategory>,
): Promise<string[]> => {
  return (await model.findOne())?.categories || [];
};

export const getInfluencerDetails = async (
  model: Model<InfluencerClaims>,
  id: string,
) => {
  return await model.findById(id);
};

export const getTotalVerifiedClaimAndAverageTrustScore = async (
  model: Model<InfluencerClaims>,
) => {
  const claims = await model.find().exec();
  const allClaims = claims.flatMap((person) => person.claim);
  const verifiedClaims = allClaims.filter(
    (claim) => claim.verification_status === VerificationStatus.VERIFIED,
  );
  const totalVerifiedClaims = verifiedClaims.length;
  const totalTrustScore = verifiedClaims.reduce(
    (sum, claim) => sum + claim.trust_score,
    0,
  );
  const averageTrustScore =
    totalVerifiedClaims > 0 ? totalTrustScore / totalVerifiedClaims : 0;

  return {
    total_verified_claims: totalVerifiedClaims,
    average_trust_score: parseFloat(averageTrustScore.toFixed(2)),
    claims,
  };
};

export const filterByCategory = async (
  model: Model<InfluencerClaims>,
  category: string,
) => {
  return model.aggregate([
    {
      $project: {
        name: 1,
        claim: {
          $filter: {
            input: '$claim',
            as: 'claimItem',
            cond: { $eq: ['$$claimItem.category', category] },
          },
        },
        last_updated: 1,
        average_trust_score: 1,
        categories: 1,

        __v: 1,
      },
    },
    {
      $match: {
        claim: { $ne: [] }, // Exclude documents with an empty `claim` array
      },
    },
  ]);
};

export function calculateAverageTrustScoreAndCategory(
  arr: AnalysedClaimsResult[],
) {
  if (arr.length === 0) return { averageTrustScore: 0, catergory: [] };
  const set = new Set();

  const totalTrustScore = arr.reduce((sum, obj) => {
    if (!set.has(obj)) {
      set.add(obj.category);
    }
    return sum + obj.trust_score;
  }, 0);
  const averageTrustScore = parseFloat(
    (totalTrustScore / arr.length).toFixed(1),
  );
  return { averageTrustScore, catergory: [...set] };
}
