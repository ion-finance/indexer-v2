import { Address } from '@ton/core'
import fs from 'fs'

import prisma from '../../src/clients/prisma'
import handleEvent from '../../src/tasks/handleEvent'
import { Trace } from '../../src/types/ton-api'

jest.mock('../../src/utils/fetchTokenData', () => {
  return {
    __esModule: true,
    default: jest.fn((address: string) => {
      if (address === 'EQDXPXpCRQScbFgRu_TXfAOHpKP6WmmOP1nICGq6ujaEKWsF') {
        return {
          minter_address: 'EQCIzrS1j1D7pBAmxysoXXvwL6OfbmBlqLlmUdSfte2fPqdJ',
          mintable: true,
          total_supply: '21000000000000000',
          metadata: {
            address:
              '0:88ceb4b58f50fba41026c72b285d7bf02fa39f6e6065a8b96651d49fb5ed9f3e',
            name: 'THANOS',
            symbol: 'THANOS',
            decimals: '9',
            image:
              'https://cache.tonapi.io/imgproxy/vUUtzIq3I756nbNBL58wYcz3RgU-PfLPzB8wFyB7OOQ/rs:fill:200:200:1/g:no/aHR0cHM6Ly90b24tdG9rZW5zLnMzLmFwLW5vcnRoZWFzdC0yLmFtYXpvbmF3cy5jb20vdGhhbm9zLnBuZw.webp',
            description: 'THANOS SNAP FINGER',
          },
          verification: 'none',
          holders_count: 5,
        }
      }

      if (address === 'EQDpKrPWD9olggJI9NAEt2b9WOxUYuspoQRCia0kQyO6EayJ') {
        return {
          minter_address: 'EQCIIkXY1INUgkbA2P1Cvt3EGWaE0xmPn1gzw8QLxopSBPtS',
          mintable: true,
          total_supply: '1000000000',
          metadata: {
            address:
              '0:882245d8d483548246c0d8fd42beddc4196684d3198f9f5833c3c40bc68a5204',
            name: 'TON',
            symbol: 'SCAM',
            decimals: '9',
            image:
              'https://cache.tonapi.io/imgproxy/Hog4f0QWzlFp-aGWSDn3k9xhDyK4xrgjDmQXZTbRqLE/rs:fill:200:200:1/g:no/aHR0cHM6Ly9jYWNoZS50b25hcGkuaW8vaW1ncHJveHkvVHhPbmZEbDQ5VUpoTG5tYnlUaU9mSGtmY2NreGU4anJfUnVRYmV2dWNRay9yczpmaWxsOjIwMDoyMDA6MS9nOm5vL2FIUjBjSE02THk5emRHRjBhV011YzNSdmJpNW1hUzlzYjJkdkwzUnZibDl6ZVcxaWIyd3VjRzVuLndlYnA.webp',
            description: 'Proxy contract for TON',
          },
          verification: 'blacklist',
          holders_count: 1,
        }
      }

      if (address === 'EQD8T1PuqXqtApdsftklxztu_V_lnRFGMV4ZyFkWDF8CsdVX') {
        return {
          minter_address: 'EQC54miSZW6HoGRq6eb2lT0ciSYSWwfdFWVxvrjQwXgmzWpH',
          mintable: true,
          total_supply: '21000000000000000',
          metadata: {
            address:
              '0:b9e26892656e87a0646ae9e6f6953d1c8926125b07dd156571beb8d0c17826cd',
            name: 'Brrr',
            symbol: 'BRRR',
            decimals: '9',
            image:
              'https://cache.tonapi.io/imgproxy/xM87Q_Oinu_cdEck3u_WXdofl8eBA9Qlr5p27UYkALc/rs:fill:200:200:1/g:no/aHR0cHM6Ly90b24tdG9rZW5zLnMzLmFwLW5vcnRoZWFzdC0yLmFtYXpvbmF3cy5jb20vYnJycjIucG5n.webp',
            description: 'Fucking Money Printer',
          },
          verification: 'none',
          holders_count: 3,
        }
      }
    }),
  }
})

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
