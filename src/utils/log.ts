import axios from 'axios'

import { logger } from 'src/config/winston'

export const error = (msg: string) => logger.error(msg)
export const warn = (msg: string) => logger.warn(msg)
export const info = (msg: string) => logger.info(msg)

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
