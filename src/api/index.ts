import express from 'express'
import poolRouter from './routers/pools'
import positionRouter from './routers/positions'
import tokenRouter from './routers/tokens'
import transactionRouter from './routers/transactions'
import binRouter from './routers/bins'
import orderRouter from './routers/orders'
import taskRouter from './routers/tasks'
import routerAddressRouter from './routers/routerAddress'
import tokenPricesRouter from './routers/tokenPrices'
import updateTokenPrices from './routers/updateTokenPrices'
import traceRouter from './routers/trace'
import cors from 'cors'
import swaggerJSDoc from 'swagger-jsdoc'
import cron from 'node-cron'
import * as swaggerUI from 'swagger-ui-express'
import updateTokenPricesLogic from './routers/updateTokenPrices/updateTokenPricesLogic'

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
api.use(positionRouter)
api.use(tokenRouter)
api.use(transactionRouter)
api.use(binRouter)
api.use(orderRouter)
api.use(taskRouter)
api.use(routerAddressRouter)
api.use(tokenPricesRouter)
api.use(updateTokenPrices)
api.use(traceRouter)
api.use('/api-docs', swaggerUI.serve, swaggerUI.setup(swaggerSpec))

// every 1 min
cron.schedule('*/1 * * * *', async () => {
  await updateTokenPricesLogic()
})

export default api
