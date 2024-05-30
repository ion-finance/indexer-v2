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
      async getTotalTransactionsCount(): Promise<number> {
        const lastLt = await prisma.indexerState.findFirst({
          where: { key: 'last_to_lt' },
        })
        return lastLt ? Number(lastLt.totalTransactionsCount) : 0
      },

      async getLastState() {
        const state = await prisma.indexerState.findFirst({
          where: { key: 'last_to_lt' },
        })
        const totalTransactionsCount = state
          ? Number(state.totalTransactionsCount)
          : 0
        const toLt = state ? state.toLt : undefined
        return { toLt, totalTransactionsCount }
      },

      async setLastState({
        toLt,
        totalTransactionsCount,
      }: {
        toLt?: string
        totalTransactionsCount: number
      }) {
        await prisma.indexerState.upsert({
          where: { key: 'last_to_lt' },
          update: {
            toLt: toLt ? toLt.toString() : '',
            totalTransactionsCount,
          },
          create: {
            key: 'last_to_lt',
            toLt: toLt ? toLt.toString() : '',
            totalTransactionsCount,
          },
        })
      },
    },
  },
})

export default IndexerStateExtenstions
