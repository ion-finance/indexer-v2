import dotenv from 'dotenv'
dotenv.config()

// eslint-disable-next-line @typescript-eslint/no-var-requires
const winston = require('winston')
// eslint-disable-next-line @typescript-eslint/no-var-requires
require('winston-papertrail').Papertrail

const railwayProjectName = process.env.RAILWAY_PROJECT_NAME
const railwayEnvironmentName = process.env.RAILWAY_ENVIRONMENT_NAME
const isProd = process.env.NODE_ENV === 'production'

const hostname = isProd
  ? `${railwayProjectName}-${railwayEnvironmentName}`
  : 'localhost'

const HOST = 'logs5.papertrailapp.com'
const PORT = 22305
const consoleLogger = new winston.transports.Console({
  level: 'debug',
  colorize: true,
  formatter: function (options: any) {
    return `[${options.level}]:${options.message}`
  },
})
const ptTransport = new winston.transports.Papertrail({
  host: HOST,
  port: PORT,
  hostname: hostname + ':' + new Date().getTime(),
  logFormat: function (level: any, message: any) {
    return `[${level}]: ${message}`
  },
})

const logger = new winston.Logger({
  transports: isProd ? [ptTransport, consoleLogger] : [consoleLogger],
})

export { logger }
