import { Prisma } from '@prisma/client'

import prisma from '..'

const IndexerStateExtenstions = Prisma.defineExtension({
  name: `IndexerStateExtensions`,
  model: {
    indexerState: {
      async getLastTimestamp(): Promise<number> {
        const lastTimestamp = await prisma.indexerState.findFirst({
          where: { key: 'last_timestamp' },
        })
        return lastTimestamp ? Number(lastTimestamp.value) : 0
      },
      async setLastTimestamp(timestamp: number): Promise<void> {
        await prisma.indexerState.upsert({
          where: { key: 'last_timestamp' },
          update: { value: timestamp.toString() },
          create: { key: 'last_timestamp', value: timestamp.toString() },
        })
      },
      async getTotalEventsCount(): Promise<number> {
        const lastTimestamp = await prisma.indexerState.findFirst({
          where: { key: 'last_timestamp' },
        })
        return lastTimestamp ? Number(lastTimestamp.totalEventsCount) : 0
      },

      async getLastState() {
        const state = await prisma.indexerState.findFirst({
          where: { key: 'last_timestamp' },
        })
        const timestamp = state ? Number(state.value) : 0
        const totalEventsCount = state ? Number(state.totalEventsCount) : 0
        const lastEventId = state ? state.lastEventId : ''
        return { timestamp, totalEventsCount, lastEventId }
      },

      async setLastState({
        timestamp,
        totalEventsCount,
        lastEventId,
      }: {
        timestamp: number
        totalEventsCount: number
        lastEventId: string
      }) {
        await prisma.indexerState.upsert({
          where: { key: 'last_timestamp' },
          update: {
            value: timestamp.toString(),
            totalEventsCount,
            lastEventId,
          },
          create: {
            key: 'last_timestamp',
            value: timestamp.toString(),
            totalEventsCount,
            lastEventId,
          },
        })
      },
    },
  },
})

export default IndexerStateExtenstions
