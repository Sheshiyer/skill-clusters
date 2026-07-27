import { describe, expect, test } from 'bun:test'
import {
  createXquikActorHelpers,
  XQUIK_FOLLOWER_ACTOR_ID,
  XQUIK_TWEET_ACTOR_ID
} from './xquik'
import type { ActorRunOptions, DatasetOptions } from '../../types'
import type { XquikApifyClient, XquikResult } from './xquik'

interface Call {
  actorId: string
  input: unknown
  options?: ActorRunOptions
}

function createFakeClient(
  status: 'SUCCEEDED' | 'FAILED' = 'SUCCEEDED'
): {
  client: XquikApifyClient
  calls: Call[]
  datasetOptions: DatasetOptions[]
} {
  const calls: Call[] = []
  const datasetOptions: DatasetOptions[] = []
  const items: XquikResult[] = [{ id: 'result-1' }]

  return {
    calls,
    datasetOptions,
    client: {
      async callActor(actorId, input, options) {
        calls.push({ actorId, input, options })
        return {
          id: 'run-1',
          status,
          defaultDatasetId: 'dataset-1'
        }
      },
      getDataset(datasetId) {
        expect(datasetId).toBe('dataset-1')
        return {
          async listItems(options) {
            datasetOptions.push(options ?? {})
            return items
          }
        }
      }
    }
  }
}

describe('Xquik Actor helpers', () => {
  test('runs the tweet Actor with live-schema input and charge limits', async () => {
    const fake = createFakeClient()
    const actors = createXquikActorHelpers(fake.client)

    const results = await actors.runTweetScraper({
      mode: 'search',
      searchTerms: ['AI automation', '#buildinpublic'],
      maxItems: 40,
      maxItemsPerTarget: 20,
      outputVariant: 'rich'
    }, {
      maxTotalChargeUsd: 1
    })

    expect(results).toEqual([{ id: 'result-1' }])
    expect(fake.calls).toEqual([{
      actorId: XQUIK_TWEET_ACTOR_ID,
      input: {
        mode: 'search',
        searchTerms: ['AI automation', '#buildinpublic'],
        maxItems: 40,
        maxItemsPerTarget: 20,
        outputVariant: 'rich'
      },
      options: {
        maxItems: 40,
        maxTotalChargeUsd: 1
      }
    }])
    expect(fake.datasetOptions).toEqual([{ limit: 40 }])
  })

  test('runs the follower Actor without replacing existing X helpers', async () => {
    const fake = createFakeClient()
    const actors = createXquikActorHelpers(fake.client)

    await actors.runFollowerScraper({
      twitterHandles: ['openai', 'nasa'],
      relation: 'followers',
      maxItems: 100,
      maxItemsPerTarget: 50,
      outputMode: 'full',
      overlapMode: true
    })

    expect(fake.calls[0]?.actorId).toBe(XQUIK_FOLLOWER_ACTOR_ID)
    expect(fake.datasetOptions).toEqual([{ limit: 100 }])
  })

  test('keeps the stricter Actor or API item cap', async () => {
    const fake = createFakeClient()
    const actors = createXquikActorHelpers(fake.client)

    await actors.runTweetScraper({
      mode: 'search',
      searchTerms: ['AI'],
      maxItems: 200
    }, {
      maxItems: 25
    })

    expect(fake.calls[0]?.options?.maxItems).toBe(25)
    expect(fake.datasetOptions).toEqual([{ limit: 25 }])
  })

  test('does not read a dataset after a failed Actor run', async () => {
    const fake = createFakeClient('FAILED')
    const actors = createXquikActorHelpers(fake.client)

    await expect(actors.runTweetScraper({
      mode: 'search',
      searchTerms: ['AI'],
      maxItems: 10
    })).rejects.toThrow(`${XQUIK_TWEET_ACTOR_ID} failed with status FAILED`)

    expect(fake.datasetOptions).toEqual([])
  })
})
