import { Order, OrderHistory, Pool } from '@prisma/client'

import CLMM from 'cache/clmm'
import prisma from 'src/clients/prisma'

const seedCLMM = async () => {
  console.log('Database Seed Started ...')
  const { pools, tokens, deposits, swaps, orderHistory, orders, bins } = CLMM

  try {
    await prisma.pool.createMany({
      data: pools as unknown as Pool[],
      skipDuplicates: true,
    })

    await prisma.token.createMany({
      data: tokens,
      skipDuplicates: true,
    })

    await prisma.deposit.createMany({
      data: deposits,
      skipDuplicates: true,
    })

    await prisma.swap.createMany({
      data: swaps,
      skipDuplicates: true,
    })

    // await prisma.orderHistory.createMany({
    //   data: orderHistory as OrderHistory[],
    //   skipDuplicates: true,
    // })

    // await prisma.order.createMany({
    //   data: orders as Order[],
    //   skipDuplicates: true,
    // })

    await prisma.bins.createMany({
      data: bins,
      skipDuplicates: true,
    })

    console.log('Database seeded successfully!')
  } catch (error) {
    console.error('Failed to seed database:', error)
    throw error
  }
}

export default seedCLMM
