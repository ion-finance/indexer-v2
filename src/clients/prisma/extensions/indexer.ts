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
    },
  },
})

export default IndexerStateExtenstions
