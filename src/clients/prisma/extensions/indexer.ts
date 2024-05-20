import { Prisma } from '@prisma/client'

import prisma from '..'

const IndexerStateExtenstions = Prisma.defineExtension({
  name: `IndexerStateExtensions`,
  model: {
    indexerState: {
      async getLastToLt(): Promise<string> {
        const last = await prisma.indexerState.findFirst({
          where: { key: 'last_to_lt' },
        })
        return last ? last.toLt : ''
      },
      async setLastToLt(toLt: string): Promise<void> {
        await prisma.indexerState.upsert({
          where: { key: 'last_to_lt' },
          update: { toLt: toLt.toString() },
          create: { key: 'last_to_lt', toLt: toLt.toString() },
        })
      },
      async getTotalEventsCount(): Promise<number> {
        const lastLt = await prisma.indexerState.findFirst({
          where: { key: 'last_to_lt' },
        })
        return lastLt ? Number(lastLt.totalEventsCount) : 0
      },

      async getLastState() {
        const state = await prisma.indexerState.findFirst({
          where: { key: 'last_to_lt' },
        })
        const totalEventsCount = state ? Number(state.totalEventsCount) : 0
        const toLt = state ? state.toLt : undefined
        return { toLt, totalEventsCount }
      },

      async setLastState({
        toLt,
        totalEventsCount,
      }: {
        toLt?: string
        totalEventsCount: number
      }) {
        await prisma.indexerState.upsert({
          where: { key: 'last_to_lt' },
          update: {
            toLt: toLt ? toLt.toString() : '',
            totalEventsCount,
          },
          create: {
            key: 'last_to_lt',
            toLt: toLt ? toLt.toString() : '',
            totalEventsCount,
          },
        })
      },
    },
  },
})

export default IndexerStateExtenstions
