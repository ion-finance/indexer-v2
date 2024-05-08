import axios from 'axios'
import chalk from 'chalk'

const CHALK = {
  error: chalk.bold.red,
  warn: chalk.yellow,
  info: chalk.green,
}

export const error = (msg: string) => console.log(CHALK.error(msg))
export const warn = (msg: string) => console.log(CHALK.warn(msg))
export const info = (msg: string) => console.log(CHALK.info(msg))

export const logError = (e: unknown) => {
  if (axios.isAxiosError(e)) {
    e.config?.url && error('url: ' + e.config.url)
    // e.response && error('data: ', e.response.data)
    e.response?.status && error('status: ' + e.response.status)
    e.response?.statusText && error('statusText: ' + e.response.statusText)
  } else {
    console.error(e)
  }
}
