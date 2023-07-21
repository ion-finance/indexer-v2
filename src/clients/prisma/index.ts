import { PrismaClient } from '@prisma/client'
import PoolExtensions from './extensions/pool'

const prisma = new PrismaClient().$extends(PoolExtensions)

export default prisma
