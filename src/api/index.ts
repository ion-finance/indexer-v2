import cors from 'cors'
import express from 'express'
import cron from 'node-cron'
import swaggerJSDoc from 'swagger-jsdoc'
import * as swaggerUI from 'swagger-ui-express'

import updateQuoteTokenPrices, {
  updateBaseTokenPrices,
} from 'src/common/updateTokenPrices'

import binRouter from './routers/bins'
import manualCPMMEventRouter from './routers/manualCPMMEvent'
import myPoolsRouter from './routers/myPools'
import operationsRouter from './routers/operations'
import orderRouter from './routers/orders'
import poolRouter from './routers/pools'
import positionRouter from './routers/positions'
import routerAddressRouter from './routers/routerAddress/routerAddress'
import simulateSwapRouter from './routers/simulate/swap'
import simulateSwapReverseRouter from './routers/simulate/swapReverse'
import taskRouter from './routers/tasks'
import tokenPricesRouter from './routers/tokenPrices'
import tokenPricesHistoryRouter from './routers/tokenPricesHistory'
import tokenRouter from './routers/tokens'
import traceRouter from './routers/trace'
import transactionRouter from './routers/transactions'
import trendingAssetsRouter from './routers/trendingAssets'
import updateTokenPrices from './routers/updateTokenPrices'

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Ion-finance',
      version: '1.0.0',
      description: 'Ion-finance indexer API',
    },
  },
  apis: ['./src/api/routers/**/*.yaml'],
}

const swaggerSpec = swaggerJSDoc(swaggerOptions)

const api = express()

api.use(cors())
api.use(poolRouter)
api.use(myPoolsRouter)
api.use(positionRouter)
api.use(tokenRouter)
api.use(transactionRouter)
api.use(binRouter)
api.use(orderRouter)
api.use(taskRouter)
api.use(routerAddressRouter)
api.use(tokenPricesRouter)
api.use(tokenPricesHistoryRouter)
api.use(trendingAssetsRouter)
api.use(updateTokenPrices)
api.use(traceRouter)
api.use(manualCPMMEventRouter)
api.use(operationsRouter)
api.use(simulateSwapRouter)
api.use(simulateSwapReverseRouter)
api.use('/api-docs', swaggerUI.serve, swaggerUI.setup(swaggerSpec))

// every 1 hour
// cron.schedule('0 */1 * * *', async () => {
// every 1 minute
cron.schedule('0 */1 * * * *', async () => {
  const isCLMM = process.env.IS_CLMM === 'true'
  if (isCLMM) {
    return
  }
  await updateBaseTokenPrices()
  await updateQuoteTokenPrices()
})

export default api
