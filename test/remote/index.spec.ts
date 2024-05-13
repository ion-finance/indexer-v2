import axios from 'axios'
import BigNumber from 'bignumber.js'
import dotenv from 'dotenv'

import { parseRaw } from '../../src/utils/address'
import { bFormatUnits } from '../../src/utils/bigNumber'

dotenv.config()

type ServerPool = {
  reserveX: string
  reserveY: string
  name: string
  id: string
  tokenX: { id: string; decimals: number }
  tokenY: { id: string; decimals: number }
}

type ContractPool = {
  decoded: {
    reserve0: string
    reserve1: string
    token0_address: string
    token1_address: string
  }
}

let serverPools: ServerPool[] = []
let contractPools: ContractPool[] = []

describe('Reserve Compare', () => {
  beforeAll(async () => {
    try {
      // Fetching data from the server API
      const { data: serverData } = await axios.get<ServerPool[]>(
        `https://api.app.ionfi.xyz/pools`,
      )
      serverPools = serverData.map((p) => ({
        id: p.id,
        name: p.name,
        reserveX: p.reserveX,
        reserveY: p.reserveY,
        tokenX: p.tokenX,
        tokenY: p.tokenY,
      }))

      // Fetching contract pools data
      const promises = serverPools.map((pool) =>
        axios
          .get<ContractPool>(
            `${process.env.TON_API_URL}/blockchain/accounts/${pool.id}/methods/get_pool_data`,
            {
              headers: {
                Authorization: `Bearer ${process.env.TON_API_KEY}`,
                'Content-type': 'application/json',
              },
            },
          )
          .then((res) => res.data),
      )

      contractPools = await Promise.all(promises)
    } catch (error) {
      console.error('Error fetching pool data:', error)
    }
  })

  it('should have the same reserve values', () => {
    contractPools.forEach((contractPool, index) => {
      const serverPool = serverPools[index]
      const { reserve0, reserve1, token0_address, token1_address } =
        contractPool.decoded

      const decimalsX = serverPool.tokenX.decimals
      const decimalsY = serverPool.tokenY.decimals
      logPool(serverPool, contractPool)
      expect(
        bFormatUnits(BigNumber(serverPool.reserveX), decimalsX).toNumber(),
      ).toBeCloseTo(bFormatUnits(BigNumber(reserve0), decimalsX).toNumber(), 2)

      expect(
        bFormatUnits(BigNumber(serverPool.reserveY), decimalsY).toNumber(),
      ).toBeCloseTo(bFormatUnits(BigNumber(reserve1), decimalsY).toNumber(), 2)
      expect(serverPool.tokenX.id).toBe(parseRaw(token0_address))
      expect(serverPool.tokenY.id).toBe(parseRaw(token1_address))
    })
  })
})

const logPool = (serverPool: ServerPool, contractPool: ContractPool) => {
  //log pool data like below to check the reserve values
  const isSameReserve0 = serverPool.reserveX === contractPool.decoded.reserve0
  const isSameReserve1 = serverPool.reserveY === contractPool.decoded.reserve1
  console.log(
    `${serverPool.name} (server reserve / contract reserve)`,
    `\n reserve0: ${serverPool.reserveX} / ${contractPool.decoded.reserve0}`,
    `\n reserve1: ${serverPool.reserveY} / ${contractPool.decoded.reserve1}`,
    `\n isSameReserve0: ${isSameReserve0}, isSameReserve1: ${isSameReserve1}`,
  )
}
