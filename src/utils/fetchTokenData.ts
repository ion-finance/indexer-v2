import { Address } from '@ton/ton'
import axios from 'axios'

import { getTokenData, saveTokenData } from 'src/redisClient'
import { JettonInfo } from 'src/types/ton-api'

import ton from '../clients/ton'
import { JettonWallet } from '../wrappers/JettonWallet'

const fetchTokenData = async (walletAddress: string) => {
  const cached = await getTokenData(walletAddress)
  if (cached) {
    return cached
  }
  const jettonWallet = ton.open(
    JettonWallet.create(Address.parse(walletAddress)),
  )
  try {
    const data = await jettonWallet.getWalletData()
    const minterAddress = data?.minter?.toString()
    if (!minterAddress) {
      return null
    }

    const res = await axios.get(
      `${process.env.TON_API_URL}/jettons/${minterAddress}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.TON_API_KEY}`,
        },
      },
    )
    const tokenData = {
      minter_address: data?.minter?.toString(),
      ...res.data,
    } as JettonInfo & { minter_address: string }
    saveTokenData(walletAddress, tokenData)

    return tokenData
  } catch {
    return null
  }
}

export default fetchTokenData
