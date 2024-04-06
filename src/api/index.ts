import express from 'express'
import poolRouter from './routers/pools'
import positionRouter from './routers/positions'
import tokenRouter from './routers/tokens'
import transactionRouter from './routers/transactions'
import binRouter from './routers/bins'
import orderRouter from './routers/orders'
import taskRouter from './routers/tasks'
import routerAddressRouter from './routers/routerAddress'
import coinPricesRouter from './routers/coinPrices'
import traceRouter from './routers/trace'
import cors from 'cors'
import swaggerJSDoc from 'swagger-jsdoc'
import * as swaggerUI from 'swagger-ui-express'

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
api.use(coinPricesRouter)
api.use(traceRouter)
api.use('/api-docs', swaggerUI.serve, swaggerUI.setup(swaggerSpec))

export default api
