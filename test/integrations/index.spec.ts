import { Address } from '@ton/core'
import fs from 'fs'

import JettonMetadata from './data/JettonMetadata'
import prisma from '../../src/clients/prisma'
import handleEvent from '../../src/tasks/handleEvent'
import { Trace } from '../../src/types/ton-api'
import { isSameAddress } from '../../src/utils/address'

jest.mock('../../src/utils/fetchTokenData', () => {
  return {
    __esModule: true,
    default: jest.fn((address: string) => {
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

  const owners = [
    'EQDu3ySOKzgD9votrq2nzaDeSeurfVSPsQwstY19OgUak1ny',
    'EQDKhNixlvODnplTlpr14ZgwfKlAWAuT5uJ5X2DtKxE6gash',
    'EQDvmxZM-wuwgWud1tUG-dFrRMr0otFwR-Lovs2g2F7UJbsb',
  ]

  scenarios.forEach((scenario, i) => {
    it(`Secnario ${i}`, async () => {
      for (const event of scenario.events) {
        await handleEvent({
          routerAddress: scenario.routerAddress,
          eventId: event.eventId,
          trace: event.trace,
        })
      }

      const pools = await prisma.pool.findMany()

      scenario.pools.forEach((pool) => {
        console.log(pool.address)
        const dbpool = pools.find(
          (p) => p.id === Address.parse(pool.address).toString(),
        )

        expect(dbpool).not.toBeNull()
        expect(dbpool!.reserveX.toString()).toBe(pool.reserve0)
        expect(dbpool!.reserveY.toString()).toBe(pool.reserve1)
      })

      const deposits = await prisma.deposit.findMany()
      const withdraws = await prisma.withdraw.findMany()
      const lpWallets = await prisma.lpTokenWallet.findMany()

      owners.forEach((ownerAddress) => {
        const targetLpWallets = lpWallets.filter((lp) =>
          isSameAddress(lp.ownerAddress, ownerAddress),
        )
        targetLpWallets.forEach((lpWallet) => {
          const poolAddress = lpWallet.poolAddress
          const targetDeposits = deposits.filter(
            (d) =>
              isSameAddress(d.poolAddress, poolAddress) &&
              isSameAddress(d.receiverAddress, ownerAddress),
          )
          const targetWithdraws = withdraws.filter(
            (w) =>
              isSameAddress(w.poolAddress, poolAddress) &&
              isSameAddress(w.senderAddress, ownerAddress),
          )
          const mintedSum = targetDeposits.reduce(
            (acc, d) => acc + BigInt(d.minted),
            BigInt(0),
          )
          const burnedSum = targetWithdraws.reduce(
            (acc, w) => acc + BigInt(w.burned),
            BigInt(0),
          )
          expect(BigInt(lpWallet.amount).toString()).toBe(
            (mintedSum - burnedSum).toString(),
          )
        })
      })
    })
  })
})
