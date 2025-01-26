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

export const perplexity = new Perplexity({
  apiKey: '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',
}).client();

export const searchTwitter = async (
  query: string,
): Promise<SearchQueryResult[]> => {
  const twitterClient = new TwitterApi(
    'AAAAAAAAAAAAAAAAAAAAADTlyQEAAAAA22B9p%2F30fHR2KYu%2FVlmQVEJxXgQ%3D2GXkdQnmpN6FGXQc6F5QLAy5INmyBZ5o2cISAIFApvFUefTF7E',
  );
  const readOnlyClient = twitterClient.readOnly;
  const result = await readOnlyClient.v2.search(query);
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  //@ts-ignore
  const { data } = result._realData;

  return data.map((tweet) => {
    return {
      link: `https://x.com/i/web/status/${tweet.id}`,
      text: tweet.text,
    };
  });
};

export const getTranscriptFromAudioUrl = async (audio_url: string) => {
  const client = new AssemblyAI({
    apiKey: '7d5e80f2c1304a44b974e2ab3ee4c704',
  });
  const transcript = await client.transcripts.transcribe({ audio_url });
  return transcript.text;
};

export const searchPodcast = async (
  query: string,
): Promise<SearchQueryResult[]> => {
  const client = Client({
    apiKey: '2f4b37f89a6d4c39ac8a7876763668d6',
  });
  const result = (await client.search({
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
};

export const analyzeForHealthRelatedClaims = async (
  contentArray: SearchQueryResult[],
) => {
  const combinedInput = JSON.stringify(contentArray);
  const query = `here ${combinedInput} is an array of objects in JSON format analyze the "text" property of each objects and Extract health-related claims. For each claim, 
  1. Categorize it (e.g., Nutrition, Fitness, Mental Health etc...) and associate it with its link from the object. 
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
