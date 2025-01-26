/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */

import { TwitterApi } from 'twitter-api-v2';
import { Client } from 'podcast-api';
import { AssemblyAI } from 'assemblyai';
import {
  AnalysedClaimsResult,
  PodcastSearchResponse,
  SearchQueryResult,
} from 'src/types';
import Perplexity, {
  ChatCompletionsPostRequest,
  ChatCompletionsPostRequestMessagesInner,
  ChatCompletionsPostRequestModelEnum,
} from 'perplexity-sdk';
import { InfluencerClaims } from 'src/research/claims.schema';
import { Model } from 'mongoose';
import OpenAI from 'openai';
import { ClaimCategory } from 'src/schema/category.schema';

export const searchTwitter = async (
  query: string,
): Promise<SearchQueryResult[]> => {
  try {
    const twitterClient = new TwitterApi(
      process.env.TWITTER_BEARER_TOKEN || '',
    );
    const readOnlyClient = twitterClient.readOnly;
    const result = await readOnlyClient.v2.search(query);

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

const convertUsingAssemblyAI = async (audio_url: string) => {
  try {
    const client = new AssemblyAI({
      apiKey: process.env.ASSEMBLY_AI_API_KEY || '',
    });
    const transcript = await client.transcripts.transcribe({ audio_url });
    return transcript.text;
  } catch (error) {
    console.log(error);
    return '';
  }
};

export const getTranscriptFromAudioUrl = async (audio_url: string) => {
  const response = await convertUsingAssemblyAI(audio_url);
  return response;
};

export const searchPodcast = async (
  query: string,
): Promise<SearchQueryResult[]> => {
  try {
    console.log({
      key: process.env.OPEN_AI_API_KEY,
      x: process.env.LISTEN_NOTES_API_KEY,
    });
    const podcastClient = Client({
      apiKey: process.env.LISTEN_NOTES_API_KEY,
    });
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const result = (await podcastClient.search({
      q: query,
      language: 'English',
    })) as PodcastSearchResponse;
    const resultData = result.data.results;

    return await Promise.all(
      resultData.map(async (data) => {
        const audioUrl = data.audio;
        const transcript = await getTranscriptFromAudioUrl(audioUrl);
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
) => {
  const perplexity = new Perplexity({
    apiKey: process.env.PERPLEXITY_API_KEY || '',
  }).client();

  const result = await perplexity.chatCompletionsPost({
    model: 'sonar-pro' as ChatCompletionsPostRequestModelEnum,
    messages,
  });
  const { choices } = result;
  if (!choices) return [];
  const { content } = choices[0]
    .message as ChatCompletionsPostRequestMessagesInner;
  return JSON.parse(content) as AnalysedClaimsResult[];
};

export const analyseUsingOpenAi = async (
  messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[],
) => {
  const openai = new OpenAI({
    apiKey: process.env.OPEN_AI_API_KEY,
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
) => {
  if (contentArray.length === 0) return [];
  const queryInput = JSON.stringify(contentArray);
  const previousClaimsAsString = JSON.stringify(previousClaims);

  const messages = generateMessage(queryInput, previousClaimsAsString);
  let response: AnalysedClaimsResult[] = [];
  try {
    response = await analyseUsingPerplexity(
      messages as ChatCompletionsPostRequest['messages'],
    );
  } catch (error) {
    console.log(error, 'FROM PERPLEXITY');
  }

  if (!response.length) {
    return await analyseUsingOpenAi(
      messages as OpenAI.Chat.Completions.ChatCompletionMessageParam[],
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
    const response = new model({
      name,
      claim: claims,
      last_updated: Date.now(),
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

export const generateMessage = (input: string, prevClaim: string) => {
  const supportedJournals = JSON.stringify([
    'The New England Journal of Medicine (NEJM)',
    'The Lancet',
    'JAMA (Journal of the American Medical Association)',
    'BMJ (British Medical Journal)',
    'Nature Medicine',
    'PLOS Medicine',
    'Clinical Infectious Diseases (CID)',
    'Annals of Internal Medicine',
  ]);
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
