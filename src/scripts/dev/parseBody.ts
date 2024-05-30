import { Cell } from '@ton/core'

import { parseBurnNotification } from 'src/parsers/cpmm/parseBurnNotification'
import { parseCbAddLiquidity } from 'src/parsers/cpmm/parseCbAddLiquidity'
import { parseMint } from 'src/parsers/cpmm/parseMint'
import { parsePayTo } from 'src/parsers/cpmm/parsePayTo'
import { parseSwap } from 'src/parsers/cpmm/parseSwap'
import { parseTransferNotification } from 'src/parsers/cpmm/parseTransferNotification'
import { getInput } from 'src/utils/userInput'

const parseBody = async () => {
  const userInput = await getInput('Enter body data: ')
  console.log(`You entered: ${userInput}`)
  const cell = Cell.fromBase64(userInput)
  const parsers = [
    {
      name: 'parseMint',
      func: parseMint,
    },
    {
      name: 'parseBurnNotification',
      func: parseBurnNotification,
    },
    {
      name: 'parseCbAddLiquidity',
      func: parseCbAddLiquidity,
    },
    {
      name: 'parsePayTo',
      func: parsePayTo,
    },
    {
      name: 'parseSwap',
      func: parseSwap,
    },
    {
      name: 'parseTransferNotification',
      func: parseTransferNotification,
    },
  ]
  parsers.forEach((parser) => {
    const { name, func } = parser
    try {
      const parsed = func(cell)
      console.log(`${name} successed`)
      if (name === 'parseSwap') {
        const { jettonAmount, minOut, ...rest } = parsed as ReturnType<
          typeof parseSwap
        >
        const jettonAmountStr = jettonAmount.toString()
        const minOutStr = minOut.toString()
        console.log('parsed', {
          jettonAmount: jettonAmountStr,
          minOut: minOutStr,
          ...rest,
        })
      } else {
        console.log('parsed', parsed)
      }
    } catch {
      console.log(`${name} failed to parse body`)
    }
  })
}

parseBody()
