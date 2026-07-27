/**
 * Xquik X Actors
 *
 * Actor listings:
 * - https://apify.com/xquik/x-tweet-scraper
 * - https://apify.com/xquik/x-follower-scraper
 *
 * These helpers preserve the existing Twitter/X integrations. Use them when
 * Xquik's multi-route post collection or audience relationship modes fit.
 */

import { Apify } from '../../index'
import type { ActorRunOptions, DatasetOptions } from '../../types'
import type { ActorRun } from 'apify-client'

export const XQUIK_TWEET_ACTOR_ID = 'xquik/x-tweet-scraper'
export const XQUIK_FOLLOWER_ACTOR_ID = 'xquik/x-follower-scraper'

export type XquikTweetMode =
  | 'legacy'
  | 'tweet'
  | 'tweets'
  | 'search'
  | 'profileTweets'
  | 'profileReplies'
  | 'profileMedia'
  | 'profileLikes'
  | 'listTweets'
  | 'article'
  | 'replies'
  | 'quotes'
  | 'thread'
  | 'retweeters'
  | 'favoriters'

export type XquikTweetOutputVariant = 'legacy' | 'rich' | 'raw'
export type XquikFieldStyle = 'legacy' | 'camelCase' | 'snake_case'
export type XquikOutputPreset = 'nested' | 'flat'

export type XquikFollowerRelation =
  | 'followers'
  | 'following'
  | 'verified_followers'
  | 'list_members'
  | 'list_followers'
  | 'community_members'

export type XquikFollowerOutputMode = 'compact' | 'full' | 'raw'
export type XquikDedupeMode = 'none' | 'first' | 'merge'
export type XquikUrl = string | { url: string }
export type XquikResult = Record<string, unknown>

export interface XquikTweetInput {
  mode?: XquikTweetMode
  outputVariant?: XquikTweetOutputVariant
  fieldStyle?: XquikFieldStyle
  outputPreset?: XquikOutputPreset
  startUrls?: XquikUrl[]
  twitterHandles?: string[]
  searchTerms?: string[]
  tweetIds?: string[]
  listIds?: string[]
  articleTweetIds?: string[]
  replyTweetIds?: string[]
  quoteTweetIds?: string[]
  threadTweetIds?: string[]
  retweeterTweetIds?: string[]
  favoriterTweetIds?: string[]
  maxItems?: number
  maxItemsPerTarget?: number
  includeRaw?: boolean
  includeUnavailableFields?: boolean
  [key: string]: unknown
}

export interface XquikFollowerInput {
  startUrls?: XquikUrl[]
  twitterHandles?: string[]
  userIds?: string[]
  listIds?: string[]
  communityIds?: string[]
  relation?: XquikFollowerRelation
  relations?: XquikFollowerRelation[]
  maxItems?: number
  maxItemsPerTarget?: number
  outputMode?: XquikFollowerOutputMode
  dedupeMode?: XquikDedupeMode
  overlapMode?: boolean
  includeTargetMetadata?: boolean
  includeUnavailableFields?: boolean
  includeUnavailableUsers?: boolean
  [key: string]: unknown
}

type XquikActorRun = Pick<ActorRun, 'id' | 'status' | 'defaultDatasetId'>

interface XquikDatasetReader {
  listItems(options?: DatasetOptions): Promise<XquikResult[]>
}

export interface XquikApifyClient {
  callActor(
    actorId: string,
    input: unknown,
    options?: ActorRunOptions
  ): Promise<XquikActorRun>
  getDataset(datasetId: string): XquikDatasetReader
}

function resolveItemCap(
  inputMaxItems: number | undefined,
  runMaxItems: number | undefined
): number | undefined {
  const caps = [inputMaxItems, runMaxItems].filter(
    (value): value is number => typeof value === 'number' && value > 0
  )
  return caps.length > 0 ? Math.min(...caps) : undefined
}

async function runXquikActor(
  apify: XquikApifyClient,
  actorId: string,
  input: XquikTweetInput | XquikFollowerInput,
  options?: ActorRunOptions
): Promise<XquikResult[]> {
  const maxItems = resolveItemCap(input.maxItems, options?.maxItems)
  const run = await apify.callActor(actorId, input, {
    ...options,
    maxItems
  })

  if (run.status !== 'SUCCEEDED') {
    throw new Error(`${actorId} failed with status ${run.status}`)
  }

  return apify.getDataset(run.defaultDatasetId).listItems({
    limit: maxItems ?? 1000
  })
}

export function createXquikActorHelpers(
  apify: XquikApifyClient = new Apify()
) {
  return {
    runTweetScraper(
      input: XquikTweetInput,
      options?: ActorRunOptions
    ): Promise<XquikResult[]> {
      return runXquikActor(apify, XQUIK_TWEET_ACTOR_ID, input, options)
    },
    runFollowerScraper(
      input: XquikFollowerInput,
      options?: ActorRunOptions
    ): Promise<XquikResult[]> {
      return runXquikActor(apify, XQUIK_FOLLOWER_ACTOR_ID, input, options)
    }
  }
}

export function runXquikTweetScraper(
  input: XquikTweetInput,
  options?: ActorRunOptions
): Promise<XquikResult[]> {
  return createXquikActorHelpers().runTweetScraper(input, options)
}

export function runXquikFollowerScraper(
  input: XquikFollowerInput,
  options?: ActorRunOptions
): Promise<XquikResult[]> {
  return createXquikActorHelpers().runFollowerScraper(input, options)
}
