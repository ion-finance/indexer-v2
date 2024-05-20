import { Address, TonClient } from '@ton/ton'

import { routerAddress } from 'src/constant/address'

const tonClient = new TonClient({
  endpoint: 'https://toncenter.com/api/v2/jsonRPC',
  apiKey: process.env.TONCENTER_API_KEY,
})
// const lt = '46072086000011'
// const hash = 'ygh06NQhiHEQAerY//JMwAJhD89++AbwQsC3Q8qznA4='
// const lt = '46498758000001'
// const hash = '1ee38351b866036f7faa40fe2cea004d7311b5f8058f8402bb220799cf2cf45b'
const lt = '46500088000001'
const hash = 'c73835a243718fba2b215fb4194221ab4b440167ff4247da3e178fcfaf31fab7'

const runTransactionsAPI = async () => {
  const address = routerAddress
  const hex = Buffer.from(hash, 'base64').toString('hex')
  console.log('hex', hex)
  try {
    const res = await tonClient.getTransactions(Address.parse(address), {
      lt,
      hash,
      limit: 2,
      archival: true,
    })
    console.log('res', res)
  } catch (e) {
    console.log('error', e)
  }
}
runTransactionsAPI()
