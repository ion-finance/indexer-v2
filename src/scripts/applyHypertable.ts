import { PrismaClient } from '@prisma/client'

import prisma from 'src/clients/prisma'

async function applyHypertable() {
  try {
    await prisma.$executeRaw`
      CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;
    `
    // await prisma.$executeRaw`
    //   -- DROP INDEX "TokenPrice_timestamp_tokenSymbol_idx";
    //   DROP INDEX "TokenPrice_timestamp_id_key";
    // `
    // await prisma.$executeRaw`
    //   ALTER TABLE "TokenPrice" DROP CONSTRAINT "TokenPrice_pkey"
    // `
    await prisma.$executeRaw`
	     SELECT create_hypertable('"TokenPrice"', 'timestamp', migrate_data => TRUE);
    `
    // await prisma.$executeRaw`
    //   CREATE UNIQUE INDEX "TokenPrice_timestamp_id_key" ON "TokenPrice" (timestamp, id);
    // `
    await prisma.$executeRaw`
       SELECT * FROM timescaledb_information.hypertables
    `

    console.log('Hypertable applied to TokenPrice table successfully.')
  } catch (error) {
    console.error('Error applying hypertable:', error)
  } finally {
    await prisma.$disconnect()
  }
}

applyHypertable()
