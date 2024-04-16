import { Address } from '@ton/core'
import fs from 'fs'

import JettonMetadata from './data/JettonMetadata'
import prisma from '../../src/clients/prisma'
import handleEvent from '../../src/tasks/handleEvent'
import { Trace } from '../../src/types/ton-api'

jest.mock('../../src/utils/fetchTokenData', () => {
  return {
    __esModule: true,
    default: jest.fn((address: string) => {
      console.log(address)
      return JettonMetadata[address]
    }),
  }
})

describe('ScenarioTest', () => {
  const scenarios: {
    routerAddress: string
    events: {
      eventId: string
      trace: Trace
    }[]
    pools: {
      address: string
      reserve0: string
      reserve1: string
      token0Fee: string
      token1Fee: string
    }[]
  }[] = []

  fs.readdirSync('test/integrations/scenarios').forEach((file) => {
    if (file.includes('.json')) {
      const data = fs.readFileSync(
        `test/integrations/scenarios/${file}`,
        'utf-8',
      )
      scenarios.push(JSON.parse(data))
    }
  })

  scenarios.forEach((scenario, i) => {
    it(`Secnario ${i}`, async () => {
      for (const event of scenario.events) {
        await handleEvent({
          routerAddress: scenario.routerAddress,
          eventId: event.eventId,
          traces: event.trace,
        })
      }

      const pools = await prisma.pool.findMany()

      scenario.pools.forEach((pool) => {
        const dbpool = pools.find(
          (p) => p.id === Address.parse(pool.address).toString(),
        )

        expect(dbpool).not.toBeNull()
        expect(dbpool!.reserveX.toString()).toBe(pool.reserve0)
        expect(dbpool!.reserveY.toString()).toBe(pool.reserve1)
      })
    })
  })
})
