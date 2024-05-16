import axios from 'axios'

import { logger } from 'src/config/winston'

type MsgElement = string | number | object | unknown
// JSON.stringify(paths, null, 3)

const parseMsg = (msgs: MsgElement[]) => {
  let str = ''
  msgs.forEach((msg: MsgElement) => {
    if (typeof msg === 'string' || typeof msg === 'number') {
      str += ' ' + msg
    } else {
      str += ' ' + JSON.stringify(msg, null, 2)
    }
  })
  return str
}
export const error = (...msgs: MsgElement[]) => logger.error(parseMsg(msgs))
export const warn = (...msgs: MsgElement[]) => logger.warn(parseMsg(msgs))
export const info = (...msgs: MsgElement[]) => logger.info(parseMsg(msgs))

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
