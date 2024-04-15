import fs from 'fs'
import { Trace } from '../../src/types/ton-api'
import handleEvent from '../../src/tasks/handleEvent'
import prisma from '../../src/clients/prisma'
import { Address } from '@ton/core'

// TODO
// 1. Reset database before each scenario
describe('ScenarioTest', () => {
  const scenarios: {
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

  fs.readdirSync('test/integrations/data').forEach((file) => {
    if (file.includes('.json')) {
      const data = fs.readFileSync(`test/integrations/data/${file}`, 'utf-8')
      scenarios.push(JSON.parse(data))
    }
  })

  // TODO spyOn testEnv

  scenarios.forEach((scenario, i) => {
    it(`Secnario ${i}`, async () => {
      for (const event of scenario.events) {
        await handleEvent(event.eventId, event.trace)
      }

      const pools = await prisma.pool.findMany()

      scenario.pools.forEach((pool) => {
        const dbpool = pools.find(
          (p) => p.id === Address.parse(pool.address).toString(),
        )

        console.log(dbpool)
        console.log(pool)

        expect(dbpool).not.toBeNull()
        expect(dbpool!.reserveX.toString()).toBe(pool.reserve0)
        expect(dbpool!.reserveY.toString()).toBe(pool.reserve1)
      })
    })
  })
})
