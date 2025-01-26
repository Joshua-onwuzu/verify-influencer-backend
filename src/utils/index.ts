/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable no-useless-escape */
import { TwitterApi } from 'twitter-api-v2';
import { Client } from 'podcast-api';
import { AssemblyAI } from 'assemblyai';
import {
  AnalysedClaimsResult,
  PodcastSearchResponse,
  SearchQueryResult,
} from 'src/types';
import Perplexity, {
  ChatCompletionsPostRequestMessagesInner,
  ChatCompletionsPostRequestModelEnum,
} from 'perplexity-sdk';
import { InfluencerClaims } from 'src/research/claims.schema';
import { Model } from 'mongoose';
import OpenAI from 'openai';

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

const convertAudioUsingOpenAI = async (url: string) => {
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
      apiKey: '',
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
  if (!response) {
    console.log('trying with open AI');
    return (await convertAudioUsingOpenAI(audio_url)) as string;
  }
  return response;
};

export const searchPodcast = async (
  query: string,
): Promise<SearchQueryResult[]> => {
  try {
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

export const analyzeForHealthRelatedClaims = async (
  contentArray: SearchQueryResult[],
) => {
  const combinedInput = JSON.stringify(contentArray);
  const query = `here ${combinedInput} is an array of objects in JSON format analyze the "text" property of each objects and Extract health-related claims. For each claim, 
  1. Categorize it (e.g., Nutrition, Fitness, Mental Health etc...) and associate it with its link (the link to be attached should only be gotten from the object where the text was being analysed from). 
  2. Cross-reference against reliable medical journals
  3. Determine a "verification_status": "Verified", "Questionable", or "Debunked" based on the cross references
  4. Assign a "trust_score" from 1 to 100.
  3. Return the results as an array of objects with \"claim_summary\", \"category\", \"link\", \"trust_score\", and \"verification_status\"".
      Return ONLY valid JSON in the following array structure (no extra text):
    [
      {
        "claim_summary": "...",
        "verification_status": "...",
        "trust_score": 0,
        "category": "..."
        "link": "..."
      },
      ...
    ]`;

  const perplexity = new Perplexity({
    apiKey: process.env.PERPLEXITY_API_KEY || '',
  }).client();

  const result = await perplexity.chatCompletionsPost({
    model: 'sonar-pro' as ChatCompletionsPostRequestModelEnum,
    messages: [
      {
        role: 'system',

        content: `You are a health claims analyzer and a medical research assistant that returns valid JSON answers only. `,
      },
      {
        role: 'user',
        content: query,
      },
    ],
  });
  const { choices } = result;
  if (!choices) return [];
  const { content } = choices[0]
    .message as ChatCompletionsPostRequestMessagesInner;
  return JSON.parse(content) as AnalysedClaimsResult[];
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
